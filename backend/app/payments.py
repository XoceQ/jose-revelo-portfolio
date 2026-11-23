from decimal import Decimal, InvalidOperation
from typing import Any

from .store import OrderStore

STATUS_MAP = {
    "approved": "approved",
    "pending": "pending",
    "authorized": "pending",
    "in_process": "pending",
    "in_mediation": "review",
    "rejected": "rejected",
    "cancelled": "rejected",
    "refunded": "rejected",
    "charged_back": "review",
}


def apply_payment(store: OrderStore, payment: dict[str, Any]) -> str | None:
    """Applies a payment fetched from Mercado Pago. Approval requires an exact amount and currency match."""
    reference = payment.get("external_reference")
    payment_id = payment.get("id")
    if not reference or payment_id is None:
        return None
    order = store.get(str(reference))
    if order is None:
        return None

    status = STATUS_MAP.get(str(payment.get("status")), "review")
    if status == "approved":
        try:
            paid = Decimal(str(payment.get("transaction_amount")))
        except InvalidOperation:
            paid = Decimal(-1)
        if paid != order.amount or payment.get("currency_id") != order.currency:
            status = "review"

    store.update_payment(order.reference, status, str(payment_id))
    updated = store.get(order.reference)
    return updated.status if updated else None
