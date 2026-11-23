import sqlite3
import time
from contextlib import contextmanager
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Iterator

SCHEMA = """
CREATE TABLE IF NOT EXISTS orders (
    reference TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_id TEXT,
    link_id TEXT,
    last_checked REAL NOT NULL DEFAULT 0,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_link ON orders(link_id, status);
"""


@dataclass(frozen=True)
class Order:
    reference: str
    item_id: str
    title: str
    amount: Decimal
    currency: str
    status: str
    payment_id: str | None
    link_id: str | None
    last_checked: float


class OrderStore:
    def __init__(self, path: str):
        self.path = path
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as db:
            db.executescript(SCHEMA)

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def create(self, reference: str, item_id: str, title: str, amount: Decimal, currency: str, link_id: str | None) -> None:
        now = time.time()
        with self._connect() as db:
            db.execute(
                "INSERT INTO orders (reference, item_id, title, amount, currency, status, link_id, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, 'created', ?, ?, ?)",
                (reference, item_id, title, str(amount), currency, link_id, now, now),
            )

    def get(self, reference: str) -> Order | None:
        with self._connect() as db:
            row = db.execute("SELECT * FROM orders WHERE reference = ?", (reference,)).fetchone()
        if row is None:
            return None
        return Order(
            row["reference"], row["item_id"], row["title"], Decimal(row["amount"]), row["currency"],
            row["status"], row["payment_id"], row["link_id"], row["last_checked"],
        )

    def link_is_paid(self, link_id: str) -> bool:
        with self._connect() as db:
            row = db.execute("SELECT 1 FROM orders WHERE link_id = ? AND status = 'approved' LIMIT 1", (link_id,)).fetchone()
        return row is not None

    def update_payment(self, reference: str, status: str, payment_id: str) -> None:
        """Records a verified status. A failed retry can never overwrite an approved payment."""
        with self._connect() as db:
            db.execute(
                "UPDATE orders SET status = ?, payment_id = ?, updated_at = ? "
                "WHERE reference = ? AND (status != 'approved' OR payment_id = ? OR ? = 'approved')",
                (status, payment_id, time.time(), reference, payment_id, status),
            )

    def mark_checked(self, reference: str) -> None:
        with self._connect() as db:
            db.execute("UPDATE orders SET last_checked = ? WHERE reference = ?", (time.time(), reference))
