"""Database tables."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


ROLES = ("recruiter", "hr_admin", "employee")


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32))
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class JobOffer(Base):
    __tablename__ = "job_offers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    # list of {id, label, kind: must|nice, weight, type: keywords|min_years, keywords, min_years}
    criteria: Mapped[list] = mapped_column(JSON)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# Candidate status: "received" and "screened" are processing states, not decisions.
# "shortlisted" is only ever set by the Action Gateway after a human approval.
CANDIDATE_STATUSES = ("received", "screened", "screening_failed", "shortlisted")


class Candidate(Base):
    __tablename__ = "candidates"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    job_id: Mapped[str] = mapped_column(ForeignKey("job_offers.id"), index=True)
    display_name: Mapped[str] = mapped_column(String(255))  # never sent to the scoring step
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_filename: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(512))
    file_sha256: Mapped[str] = mapped_column(String(64))
    file_kind: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(32), default="received")
    risk_level: Mapped[str] = mapped_column(String(16), default="none")
    risk_flags: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Screening(Base):
    __tablename__ = "screenings"
    __table_args__ = (UniqueConstraint("candidate_id", name="uq_screening_candidate"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    candidate_id: Mapped[str] = mapped_column(ForeignKey("candidates.id"))
    job_id: Mapped[str] = mapped_column(ForeignKey("job_offers.id"), index=True)
    blind_profile: Mapped[dict] = mapped_column(JSON)  # job-related facts only, each with a verified quote
    criteria_results: Mapped[list] = mapped_column(JSON)
    rejected_evidence: Mapped[list] = mapped_column(JSON, default=list)  # claims whose quote was not in the CV
    score: Mapped[float] = mapped_column(Float)
    must_have_met: Mapped[int] = mapped_column(Integer)
    must_have_total: Mapped[int] = mapped_column(Integer)
    justification: Mapped[str] = mapped_column(Text)
    engine: Mapped[str] = mapped_column(String(128))  # e.g. "offline-heuristic (SIMULATED)" or "groq:openai/gpt-oss-120b"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


PROPOSAL_STATUSES = ("pending", "approved", "rejected", "executed", "failed", "superseded")


class Proposal(Base):
    __tablename__ = "proposals"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    type: Mapped[str] = mapped_column(String(32))
    job_id: Mapped[str | None] = mapped_column(ForeignKey("job_offers.id"), nullable=True, index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    payload_hash: Mapped[str] = mapped_column(String(64))
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)
    risk_flags: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    created_by: Mapped[str] = mapped_column(String(64))  # e.g. "agent:screening"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    reviewed_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    execution_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AuditLog(Base):
    """Append-only, hash-chained log. Each row's hash covers the previous row's hash."""

    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    actor_type: Mapped[str] = mapped_column(String(16))  # user | agent | system
    actor_id: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(64), index=True)
    entity_type: Mapped[str] = mapped_column(String(32))
    entity_id: Mapped[str] = mapped_column(String(64))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    prev_hash: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))


class BackgroundTask(Base):
    __tablename__ = "background_tasks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    type: Mapped[str] = mapped_column(String(32))
    payload: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(16), default="queued", index=True)  # queued|running|done|failed
    progress_done: Mapped[int] = mapped_column(Integer, default=0)
    progress_total: Mapped[int] = mapped_column(Integer, default=0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
