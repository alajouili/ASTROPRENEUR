# app/models/proposal.py
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # e.g., "send_email", "schedule_interview", "shortlist_candidate"
    action_type: Mapped[str] = mapped_column(String, nullable=False) 
    
    # The exact payload the LLM generated (e.g., {"to": "...", "body": "..."})
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # 'pending', 'approved', 'rejected'
    status: Mapped[str] = mapped_column(String, default="pending") 
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String) # The user/agent that made it