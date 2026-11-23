import json
import logging
import re
import secrets
import threading
import time
from collections import defaultdict, deque
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from .config import Settings, get_settings
from .gateway import GatewayError, MercadoPagoGateway
from .payment_links import read_token
from .payments import apply_payment
from .signature import is_valid_signature
from .store import OrderStore

logger = logging.getLogger("payments")
CATALOG_PATH = Path(__file__).resolve().parent.parent / "catalog.json"
RECONCILE_INTERVAL_SECONDS = 5
CHECKOUT_LIMIT_PER_MINUTE = 10
_attempts: dict[str, deque[float]] = defaultdict(deque)
_attempts_lock = threading.Lock()


class CheckoutRequest(BaseModel):
    package_id: str | None = Field(default=None, max_length=40)
    payment_token: str | None = Field(default=None, max_length=1200)
    language: Literal["en", "es"] = "en"

    @model_validator(mode="after")
    def exactly_one_source(self) -> "CheckoutRequest":
        if bool(self.package_id) == bool(self.payment_token):
            raise ValueError("Provide package_id or payment_token")
        return self


@lru_cache
def get_store() -> OrderStore:
    return OrderStore(get_settings().database_path)


@lru_cache
def get_gateway() -> MercadoPagoGateway:
    return MercadoPagoGateway(get_settings().mp_access_token.get_secret_value())


SettingsDep = Annotated[Settings, Depends(get_settings)]
StoreDep = Annotated[OrderStore, Depends(get_store)]
GatewayDep = Annotated[MercadoPagoGateway, Depends(get_gateway)]


def load_catalog() -> list[dict]:
    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return [
        {**item, "unit_price": str(Decimal(str(item["unit_price"]))), "currency": data["currency"]}
        for item in data["items"]
        if item.get("unit_price") is not None and Decimal(str(item["unit_price"])) > 0
    ]


def enforce_rate_limit(request: Request) -> None:
    client = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _attempts_lock:
        attempts = _attempts[client]
        while attempts and now - attempts[0] > 60:
            attempts.popleft()
        if len(attempts) >= CHECKOUT_LIMIT_PER_MINUTE:
            raise HTTPException(429, "Too many checkout attempts")
        attempts.append(now)


def create_app() -> FastAPI:
    app = FastAPI(title="José Revelo Payment API", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Accept"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/catalog")
    def catalog() -> dict[str, list[dict]]:
        return {"items": load_catalog()}

    @app.get("/api/payment-links/{token}")
    def payment_link(token: str, settings: SettingsDep, store: StoreDep) -> dict[str, str]:
        link = read_token(token, settings.payment_link_secret.get_secret_value())
        if link is None or store.link_is_paid(link.link_id):
            raise HTTPException(404, "Payment link unavailable")
        return {"description": link.description, "amount": str(link.amount), "currency": link.currency}

    @app.post("/api/checkout", dependencies=[Depends(enforce_rate_limit)])
    def checkout(body: CheckoutRequest, settings: SettingsDep, store: StoreDep, gateway: GatewayDep) -> dict[str, str]:
        link_id = None
        if body.payment_token:
            link = read_token(body.payment_token, settings.payment_link_secret.get_secret_value())
            if link is None or store.link_is_paid(link.link_id):
                raise HTTPException(404, "Payment link unavailable")
            item_id, title, amount, currency, link_id = "custom", link.description, link.amount, link.currency, link.link_id
        else:
            item = next((entry for entry in load_catalog() if entry["id"] == body.package_id), None)
            if item is None:
                raise HTTPException(404, "Package unavailable")
            item_id, title, amount, currency = item["id"], item["title"][body.language], Decimal(item["unit_price"]), item["currency"]

        reference = secrets.token_urlsafe(24)
        store.create(reference, item_id, title, amount, currency, link_id)
        return_url = f"{settings.frontend_base}/?checkout=return&order={reference}"
        try:
            preference = gateway.create_preference(reference, title, amount, currency, return_url, settings.webhook_url)
        except GatewayError as error:
            logger.error("Preference creation failed: %s", error)
            store.update_payment(reference, "rejected", "not-started")
            raise HTTPException(502, "Payment provider unavailable") from None

        url = preference.get("sandbox_init_point" if settings.mp_use_sandbox else "init_point")
        if not url:
            raise HTTPException(502, "Payment provider returned no checkout URL")
        return {"checkout_url": url, "reference": reference}

    @app.get("/api/orders/{reference}")
    def order_status(reference: str, store: StoreDep, gateway: GatewayDep) -> dict[str, str]:
        order = store.get(reference)
        if order is None:
            raise HTTPException(404, "Order not found")
        # Covers a delayed webhook by asking Mercado Pago directly, at a limited rate.
        if order.status in {"created", "pending"} and time.time() - order.last_checked >= RECONCILE_INTERVAL_SECONDS:
            store.mark_checked(reference)
            try:
                for payment in gateway.search_payments(reference):
                    apply_payment(store, payment)
            except GatewayError as error:
                logger.warning("Reconciliation failed: %s", error)
            order = store.get(reference) or order
        return {"reference": order.reference, "status": order.status}

    @app.post("/api/webhooks/mercadopago")
    async def webhook(
        request: Request,
        settings: SettingsDep,
        store: StoreDep,
        gateway: GatewayDep,
        data_id: Annotated[str | None, Query(alias="data.id")] = None,
        event_type: Annotated[str | None, Query(alias="type")] = None,
        x_signature: Annotated[str | None, Header()] = None,
        x_request_id: Annotated[str | None, Header()] = None,
    ) -> dict[str, bool]:
        if not is_valid_signature(x_signature, x_request_id, data_id, settings.mp_webhook_secret.get_secret_value()):
            raise HTTPException(401, "Invalid signature")

        if event_type is None:
            try:
                event_type = (await request.json()).get("type")
            except (ValueError, AttributeError):
                event_type = None
        if event_type != "payment":
            return {"received": True}
        if not data_id or not re.fullmatch(r"\d{1,30}", data_id):
            raise HTTPException(400, "Invalid payment id")

        # The notification is only a hint. The payment itself is always fetched from Mercado Pago.
        try:
            from starlette.concurrency import run_in_threadpool

            payment = await run_in_threadpool(gateway.get_payment, data_id)
            await run_in_threadpool(apply_payment, store, payment)
        except GatewayError as error:
            logger.error("Payment lookup failed: %s", error)
            raise HTTPException(502, "Could not verify payment") from None
        return {"received": True}

    return app


app = create_app()
