from decimal import Decimal
from typing import Any

import httpx

API_BASE = "https://api.mercadopago.com"


class GatewayError(Exception):
    """Mercado Pago could not be reached or refused the request."""


class MercadoPagoGateway:
    def __init__(self, access_token: str, transport: httpx.BaseTransport | None = None):
        self._client = httpx.Client(
            base_url=API_BASE,
            timeout=12,
            transport=transport,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        try:
            response = self._client.request(method, path, **kwargs)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as error:
            # Never log the exception's request, because it carries the bearer token.
            raise GatewayError(type(error).__name__) from None

    def create_preference(
        self,
        reference: str,
        title: str,
        amount: Decimal,
        currency: str,
        return_url: str,
        notification_url: str | None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "items": [{"id": reference, "title": title[:250], "quantity": 1, "unit_price": float(amount), "currency_id": currency}],
            "external_reference": reference,
            "back_urls": {"success": return_url, "pending": return_url, "failure": return_url},
        }
        # Mercado Pago rejects auto_return for local return URLs.
        if return_url.startswith("https://"):
            body["auto_return"] = "approved"
        if notification_url:
            body["notification_url"] = notification_url
        return self._request("POST", "/checkout/preferences", json=body, headers={"X-Idempotency-Key": reference})

    def get_payment(self, payment_id: str) -> dict[str, Any]:
        return self._request("GET", f"/v1/payments/{payment_id}")

    def search_payments(self, reference: str) -> list[dict[str, Any]]:
        data = self._request(
            "GET",
            "/v1/payments/search",
            params={"external_reference": reference, "sort": "date_created", "criteria": "asc"},
        )
        return data.get("results", [])
