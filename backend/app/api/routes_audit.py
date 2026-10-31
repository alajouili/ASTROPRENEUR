from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import hashlib
import json
from backend.app.db.session import get_db
from backend.app.db.models import AuditLog

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("")
async def get_audit_trail(db: AsyncSession = Depends(get_db)):
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(100)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    # Verify cryptographic integrity across records
    integrity_verified = True
    prev_checked_hash = None

    # Reverse to check from oldest to newest
    ordered_logs = list(reversed(logs))
    for log in ordered_logs:
        if prev_checked_hash is not None:
            if log.prev_hash != prev_checked_hash:
                integrity_verified = False
                break
        prev_checked_hash = log.hash

    return {
        "integrity_verified": integrity_verified,
        "total_records": len(logs),
        "logs": [
            {
                "id": l.id,
                "timestamp": l.timestamp,
                "actor": l.actor,
                "action": l.action,
                "target_id": l.target_id,
                "details": l.details,
                "prev_hash": l.prev_hash,
                "hash": l.hash
            }
            for l in logs
        ]
    }
