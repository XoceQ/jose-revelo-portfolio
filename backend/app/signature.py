"""Mercado Pago webhook signature check, matching the official SDK (mercadopago 3.6.2)."""

import hashlib
import hmac


def _clean(value: str | None) -> str | None:
    value = value.strip() if value else None
    return value or None


def build_manifest(data_id: str | None, request_id: str | None, ts: str) -> str:
    parts = []
    if data_id:
        parts.append(f"id:{data_id}")
    if request_id:
        parts.append(f"request-id:{request_id}")
    parts.append(f"ts:{ts}")
    return ";".join(parts) + ";"


def is_valid_signature(x_signature: str | None, x_request_id: str | None, data_id: str | None, secret: str) -> bool:
    header = _clean(x_signature)
    if not header:
        return False

    values: dict[str, str] = {}
    for part in header.split(","):
        key, separator, value = part.partition("=")
        if separator and key.strip() and value.strip():
            values[key.strip().lower()] = value.strip()

    ts, received = values.get("ts"), values.get("v1")
    if not ts or not ts.isascii() or not ts.isdigit() or not received:
        return False

    manifest = build_manifest(_clean(data_id), _clean(x_request_id), ts)
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected.encode(), received.encode())
