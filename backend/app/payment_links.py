"""Signed, expiring links for quoted work, so a browser can never choose its own price."""

import argparse
import base64
import binascii
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from .config import get_settings


@dataclass(frozen=True)
class PaymentLink:
    link_id: str
    description: str
    amount: Decimal
    currency: str
    expires_at: int


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _sign(payload: str, secret: str) -> str:
    return _b64(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest())


def create_token(description: str, amount: Decimal, currency: str, days: int, secret: str) -> str:
    if amount <= 0:
        raise ValueError("amount must be positive")
    body = {
        "id": secrets.token_urlsafe(12),
        "description": description[:200],
        "amount": str(amount),
        "currency": currency.upper(),
        "exp": int(time.time()) + days * 86400,
    }
    payload = _b64(json.dumps(body, separators=(",", ":")).encode())
    return f"{payload}.{_sign(payload, secret)}"


def read_token(token: str, secret: str) -> PaymentLink | None:
    payload, separator, signature = token.partition(".")
    if not separator or not hmac.compare_digest(_sign(payload, secret).encode(), signature.encode()):
        return None
    try:
        body = json.loads(_unb64(payload))
        link = PaymentLink(body["id"], body["description"], Decimal(body["amount"]), body["currency"], int(body["exp"]))
    except (KeyError, ValueError, TypeError, InvalidOperation, binascii.Error):
        return None
    return link if link.expires_at > time.time() and link.amount > 0 else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a private Mercado Pago payment link.")
    parser.add_argument("--amount", type=Decimal, required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--currency", default="COP")
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()
    settings = get_settings()
    token = create_token(args.description, args.amount, args.currency, args.days, settings.payment_link_secret.get_secret_value())
    print(f"{settings.frontend_base}/?pay={token}")


if __name__ == "__main__":
    main()
