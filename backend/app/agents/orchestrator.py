"""Orchestrator: a fixed routing table from task type to workflow. No LLM decides the route.

New workflows (inbox triage, replies, follow-ups, scheduling, policy Q&A) are
added here as they are built.
"""
from collections.abc import Callable

from sqlalchemy.orm import Session

from app.agents.screening.engines import build_engine
from app.agents.screening.service import screen_job
from app.config import Settings
from app.models import BackgroundTask

Handler = Callable[[Session, BackgroundTask, Settings], dict]


def _screen(db: Session, task: BackgroundTask, settings: Settings) -> dict:
    return screen_job(db, task, build_engine(settings), settings)


ROUTES: dict[str, Handler] = {
    "screen_job": _screen,
}


def dispatch(db: Session, task: BackgroundTask, settings: Settings) -> dict:
    handler = ROUTES.get(task.type)
    if handler is None:
        raise ValueError(f"no workflow for task type {task.type!r}")
    return handler(db, task, settings)
