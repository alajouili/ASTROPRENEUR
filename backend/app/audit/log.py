"""Tamper-evident audit trail.

Every entry stores the hash of the previous entry, so editing or deleting a row
breaks the chain and `verify_chain` reports where. PostgreSQL triggers (db.py)
also block UPDATE / DELETE / TRUNCATE on the table outright.
"""
import hashlib
import json
from datetime import timezone

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import AuditLog, utcnow

GENESIS_HASH = "0" * 64
_LOCK_KEY = 7_342_001  # serialises appends so the chain never forks


def _entry_hash(prev_hash: str, row: AuditLog) -> str:
    body = {
        "at": row.at.astimezone(timezone.utc).isoformat(timespec="microseconds"),
        "actor_type": row.actor_type,
        "actor_id": row.actor_id,
        "action": row.action,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "details": row.details,
    }
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)
    return hashlib.sha256((prev_hash + canonical).encode("utf-8")).hexdigest()


def append(
    db: Session,
    *,
    actor_type: str,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict | None = None,
) -> AuditLog:
    """Add one entry inside the caller's transaction (committed with the action it records)."""
    if actor_type not in {"user", "agent", "system"}:
        raise ValueError(f"unknown actor_type {actor_type!r}")
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": _LOCK_KEY})
    last = db.execute(select(AuditLog).order_by(AuditLog.id.desc()).limit(1)).scalar_one_or_none()
    prev_hash = last.hash if last else GENESIS_HASH
    row = AuditLog(
        at=utcnow(),
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details or {},
        prev_hash=prev_hash,
        hash="",
    )
    row.hash = _entry_hash(prev_hash, row)
    db.add(row)
    db.flush()
    return row


def verify_chain(db: Session) -> dict:
    """Recompute every hash. Returns {"ok", "checked", "first_bad_id"}."""
    prev_hash = GENESIS_HASH
    checked = 0
    for row in db.execute(select(AuditLog).order_by(AuditLog.id)).scalars():
        if row.prev_hash != prev_hash or _entry_hash(prev_hash, row) != row.hash:
            return {"ok": False, "checked": checked, "first_bad_id": row.id}
        prev_hash = row.hash
        checked += 1
    return {"ok": True, "checked": checked, "first_bad_id": None}
