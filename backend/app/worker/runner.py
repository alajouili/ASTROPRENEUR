"""Background worker: claims queued tasks from PostgreSQL and runs them.

Tasks survive restarts (they live in the database), several workers can run in
parallel (SELECT ... FOR UPDATE SKIP LOCKED), and a failed task records its error.

Run:  python -m app.worker.runner
"""
import logging
import threading
import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.orchestrator import dispatch
from app.config import get_settings
from app.db import get_sessionmaker, init_db
from app.models import BackgroundTask

log = logging.getLogger("trusthr.worker")
MAX_ATTEMPTS = 2


def enqueue(db: Session, *, type: str, payload: dict, created_by: str) -> BackgroundTask:
    task = BackgroundTask(type=type, payload=payload, created_by=created_by)
    db.add(task)
    db.flush()
    return task


def _claim(db: Session) -> BackgroundTask | None:
    stmt = select(BackgroundTask).where(BackgroundTask.status == "queued").order_by(BackgroundTask.created_at).limit(1)
    if db.get_bind().dialect.name == "postgresql":
        stmt = stmt.with_for_update(skip_locked=True)
    task = db.execute(stmt).scalar_one_or_none()
    if task is None:
        return None
    task.status = "running"
    task.attempts += 1
    db.commit()
    return task


def run_once() -> bool:
    """Process one task. Returns False when the queue is empty."""
    settings = get_settings()
    db = get_sessionmaker()()
    try:
        task = _claim(db)
        if task is None:
            return False
        try:
            result = dispatch(db, task, settings)
            task.status = "done"
            task.error = None
            task.payload = {**task.payload, "result": result}
        except Exception as exc:  # recorded, never swallowed
            db.rollback()
            task = db.get(BackgroundTask, task.id)
            log.exception("task %s failed", task.id)
            task.error = f"{type(exc).__name__}: {str(exc)[:500]}"
            task.status = "queued" if task.attempts < MAX_ATTEMPTS else "failed"
        db.commit()
        return True
    finally:
        db.close()


def run_until_empty(max_tasks: int = 100) -> int:
    done = 0
    while done < max_tasks and run_once():
        done += 1
    return done


def run_forever(poll_seconds: float = 1.0, stop: threading.Event | None = None) -> None:
    while not (stop and stop.is_set()):
        if not run_once():
            time.sleep(poll_seconds)


def start_embedded(stop: threading.Event) -> threading.Thread:
    thread = threading.Thread(target=run_forever, kwargs={"stop": stop}, name="embedded-worker", daemon=True)
    thread.start()
    return thread


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
    log.info("worker started")
    run_forever()
