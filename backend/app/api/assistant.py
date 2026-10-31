"""Policy Assistant API. Every signed-in role may ask; each role only sees its documents.

The answer acts on no one, so it needs no approval (architecture, flow E). It is audited
without the question text (it may contain personal details).
"""
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.agents.llm import build_llm_client
from app.agents.policy_assistant.knowledge import AUDIENCES_BY_ROLE
from app.agents.policy_assistant.service import OFFLINE_MODE, Turn, answer_question, get_index, resolve_policy_dir
from app.audit.log import append as audit
from app.auth.security import get_current_user
from app.config import get_settings
from app.db import get_db
from app.models import User

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
_recent: dict[str, deque] = defaultdict(deque)  # per user, in memory (one API process)


class TurnIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class AskIn(BaseModel):
    question: str = Field(max_length=1000)
    history: list[TurnIn] = Field(default_factory=list, max_length=10)

    @field_validator("question")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("question must not be empty")
        return v.strip()


def _rate_limit(user_id: str, per_minute: int) -> None:
    now = time.monotonic()
    window = _recent[user_id]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= per_minute:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many questions, wait a minute")
    window.append(now)


@router.get("/status")
def assistant_status(user: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    index = get_index(resolve_policy_dir(settings.policy_dir))
    llm = build_llm_client(settings)
    return {
        "mode": llm.label if llm else OFFLINE_MODE,
        "llm_configured": llm is not None,
        "documents": index.documents(AUDIENCES_BY_ROLE.get(user.role, {"all"})),
    }


@router.post("/ask")
def ask(body: AskIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    _rate_limit(user.id, settings.assistant_questions_per_minute)
    index = get_index(resolve_policy_dir(settings.policy_dir))
    if not index.passages:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No policy documents are available")
    reply = answer_question(body.question, [Turn(t.role, t.content) for t in body.history], user.role, index,
                            build_llm_client(settings))
    audit(db, actor_type="user", actor_id=user.id, action="assistant.asked", entity_type="user", entity_id=user.id,
          details={"found": reply.found, "mode": reply.mode, "flagged": reply.flagged,
                   "sources": [s["id"] for s in reply.sources], "llm_error": reply.error})
    db.commit()
    return {"answer": reply.answer, "found": reply.found, "mode": reply.mode, "notice": reply.notice,
            "flagged": reply.flagged, "sources": reply.sources}
