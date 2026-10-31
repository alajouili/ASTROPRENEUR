"""Audit trail (HR admin only)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.log import verify_chain
from app.auth.security import require_roles
from app.db import get_db
from app.models import AuditLog, User

router = APIRouter(prefix="/api/audit", tags=["audit"])
admin_only = require_roles("hr_admin")


@router.get("")
def list_audit(limit: int = 200, db: Session = Depends(get_db), user: User = Depends(admin_only)) -> list[dict]:
    rows = db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(max(1, min(limit, 1000))))
    return [{"id": r.id, "at": r.at.isoformat(), "actor_type": r.actor_type, "actor_id": r.actor_id, "action": r.action,
             "entity_type": r.entity_type, "entity_id": r.entity_id, "details": r.details, "hash": r.hash} for r in rows]


@router.get("/verify")
def verify(db: Session = Depends(get_db), user: User = Depends(admin_only)) -> dict:
    return verify_chain(db)
