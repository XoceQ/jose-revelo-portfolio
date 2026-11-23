import hashlib
import hmac
import os
from decimal import Decimal

os.environ.update(
    MP_ACCESS_TOKEN="TEST-token-value",
    MP_WEBHOOK_SECRET="webhook-secret-value",
    PAYMENT_LINK_SECRET="x" * 40,
    FRONTEND_URL="https://example.test/site",
    PUBLIC_API_URL="https://api.example.test",
    ALLOWED_ORIGINS="https://example.test",
    MP_USE_SANDBOX="true",
)

import httpx  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.gateway import MercadoPagoGateway  # noqa: E402
from app.main import _attempts, app, get_gateway, get_store  # noqa: E402
from app.payment_links import create_token, read_token  # noqa: E402
from app.signature import build_manifest, is_valid_signature  # noqa: E402
from app.store import OrderStore  # noqa: E402

SECRET = "webhook-secret-value"
LINK_SECRET = "x" * 40


def sign(data_id: str, request_id: str, ts: str = "1704908010") -> str:
    manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
    return f"ts={ts},v1={hmac.new(SECRET.encode(), manifest.encode(), hashlib.sha256).hexdigest()}"


@pytest.fixture
def env(tmp_path):
    payments: dict[str, dict] = {}
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/checkout/preferences":
            captured["preference"] = request.read()
            captured["auth"] = request.headers["authorization"]
            return httpx.Response(201, json={"id": "p1", "init_point": "https://www.mercadopago.com.co/live", "sandbox_init_point": "https://sandbox.mercadopago.com.co/test"})
        if request.url.path == "/v1/payments/search":
            ref = request.url.params["external_reference"]
            return httpx.Response(200, json={"results": [p for p in payments.values() if p["external_reference"] == ref]})
        payment = payments.get(request.url.path.rsplit("/", 1)[-1])
        return httpx.Response(200, json=payment) if payment else httpx.Response(404, json={})

    store = OrderStore(str(tmp_path / "orders.db"))
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_gateway] = lambda: MercadoPagoGateway("TEST-token-value", httpx.MockTransport(handler))
    _attempts.clear()
    yield TestClient(app), store, payments, captured
    app.dependency_overrides.clear()


def order(store: OrderStore, reference="ref1", amount="100000", link_id=None):
    store.create(reference, "custom", "Work", Decimal(amount), "COP", link_id)


def post_webhook(client, payment_id: str):
    return client.post(
        f"/api/webhooks/mercadopago?data.id={payment_id}&type=payment",
        headers={"x-signature": sign(payment_id, "req-1"), "x-request-id": "req-1"},
        json={"type": "payment", "data": {"id": payment_id}},
    )


def test_manifest_matches_sdk_format_and_omits_missing_fields():
    assert build_manifest("123", "abc", "9") == "id:123;request-id:abc;ts:9;"
    assert build_manifest(None, "abc", "9") == "request-id:abc;ts:9;"
    assert build_manifest(None, None, "9") == "ts:9;"


@pytest.mark.parametrize("header", [None, "", "garbage", "ts=abc,v1=ff", "ts=1704908010", "v1=ff", "ts=1704908010,v1=" + "0" * 64])
def test_bad_signatures_are_rejected(header):
    assert not is_valid_signature(header, "req-1", "123", SECRET)


def test_good_signature_is_accepted_and_bound_to_payment_id():
    header = sign("123", "req-1")
    assert is_valid_signature(header, "req-1", "123", SECRET)
    assert not is_valid_signature(header, "req-1", "124", SECRET)


def test_unsigned_webhook_cannot_approve(env):
    client, store, payments, _ = env
    order(store)
    payments["55"] = {"id": 55, "status": "approved", "external_reference": "ref1", "transaction_amount": 100000, "currency_id": "COP"}
    response = client.post("/api/webhooks/mercadopago?data.id=55&type=payment", json={"type": "payment"})
    assert response.status_code == 401
    assert store.get("ref1").status == "created"


def test_signed_webhook_approves_after_server_verification(env):
    client, store, payments, _ = env
    order(store)
    payments["55"] = {"id": 55, "status": "approved", "external_reference": "ref1", "transaction_amount": 100000.0, "currency_id": "COP"}
    assert post_webhook(client, "55").status_code == 200
    assert store.get("ref1").status == "approved"


@pytest.mark.parametrize("change", [{"transaction_amount": 1}, {"currency_id": "USD"}])
def test_amount_or_currency_mismatch_is_not_approved(env, change):
    client, store, payments, _ = env
    order(store)
    payments["55"] = {"id": 55, "status": "approved", "external_reference": "ref1", "transaction_amount": 100000, "currency_id": "COP", **change}
    post_webhook(client, "55")
    assert store.get("ref1").status == "review"


def test_later_failed_attempt_cannot_undo_approval(env):
    client, store, payments, _ = env
    order(store)
    payments["55"] = {"id": 55, "status": "approved", "external_reference": "ref1", "transaction_amount": 100000, "currency_id": "COP"}
    payments["56"] = {"id": 56, "status": "rejected", "external_reference": "ref1", "transaction_amount": 100000, "currency_id": "COP"}
    post_webhook(client, "55")
    post_webhook(client, "56")
    assert store.get("ref1").status == "approved"


def test_refund_of_same_payment_removes_approval(env):
    client, store, payments, _ = env
    order(store)
    payments["55"] = {"id": 55, "status": "approved", "external_reference": "ref1", "transaction_amount": 100000, "currency_id": "COP"}
    post_webhook(client, "55")
    payments["55"]["status"] = "refunded"
    post_webhook(client, "55")
    assert store.get("ref1").status == "rejected"


def test_browser_return_parameters_do_not_change_status(env):
    client, store, _, _ = env
    order(store)
    response = client.get("/api/orders/ref1?status=approved&payment_id=55&collection_status=approved")
    assert response.json()["status"] == "created"


def test_unpriced_catalog_cannot_be_purchased(env):
    client, _, _, _ = env
    assert client.get("/api/catalog").json() == {"items": []}
    assert client.post("/api/checkout", json={"package_id": "backend"}).status_code == 404


def test_client_cannot_set_price_and_link_checkout_uses_signed_amount(env):
    client, store, _, captured = env
    token = create_token("Quoted API work", Decimal("250000"), "COP", 7, LINK_SECRET)
    response = client.post("/api/checkout", json={"payment_token": token, "unit_price": 1, "amount": 1})
    assert response.status_code == 200
    assert response.json()["checkout_url"] == "https://sandbox.mercadopago.com.co/test"
    assert store.get(response.json()["reference"]).amount == Decimal("250000")
    assert b'"unit_price":250000.0' in captured["preference"]


def test_tampered_or_expired_links_are_rejected():
    token = create_token("Work", Decimal("1000"), "COP", 7, LINK_SECRET)
    assert read_token(token, LINK_SECRET).amount == Decimal("1000")
    assert read_token(token[:-2] + "aa", LINK_SECRET) is None
    assert read_token(token, "y" * 40) is None
    assert read_token(create_token("Work", Decimal("1000"), "COP", -1, LINK_SECRET), LINK_SECRET) is None


def test_paid_link_cannot_be_reused(env):
    client, store, _, _ = env
    token = create_token("Work", Decimal("1000"), "COP", 7, LINK_SECRET)
    link = read_token(token, LINK_SECRET)
    order(store, "paid", "1000", link.link_id)
    store.update_payment("paid", "approved", "9")
    assert client.get(f"/api/payment-links/{token}").status_code == 404
    assert client.post("/api/checkout", json={"payment_token": token}).status_code == 404


def test_checkout_rate_limit(env):
    client, _, _, _ = env
    codes = [client.post("/api/checkout", json={"package_id": "none"}).status_code for _ in range(11)]
    assert codes[-1] == 429
