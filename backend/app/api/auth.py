"""Login / logout / current user."""
import time
from collections import defaultdict, deque
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.log import append as audit
from app.auth.security import (
    CSRF_COOKIE, SESSION_COOKIE, create_session_token, get_current_user, hash_password, verify_password,
)
from app.config import get_settings
from app.db import get_db
from app.models import User, utcnow

router = APIRouter(prefix="/api/auth", tags=["auth"])

LOGIN_LIMIT_PER_MINUTE = 5
LOCK_AFTER_FAILURES = 10
LOCK_MINUTES = 15
_attempts: dict[str, deque] = defaultdict(deque)  # in-memory, per API process
_DUMMY_HASH = hash_password("timing-equaliser-not-a-real-password")


def _rate_limit(ip: str) -> None:
    now = time.monotonic()
    window = _attempts[ip]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= LOGIN_LIMIT_PER_MINUTE:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many login attempts, wait a minute")
    window.append(now)


class LoginIn(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=256)


def user_out(user: User) -> dict:
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}


@router.post("/login")
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    _rate_limit(request.client.host if request.client else "unknown")
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user is None:
        verify_password(body.password, _DUMMY_HASH)  # same timing whether or not the account exists
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if user.locked_until and user.locked_until > utcnow():
        raise HTTPException(status.HTTP_423_LOCKED, "Account temporarily locked after repeated failures")
    if not verify_password(body.password, user.password_hash):
        user.failed_logins += 1
        if user.failed_logins >= LOCK_AFTER_FAILURES:
            user.locked_until = utcnow() + timedelta(minutes=LOCK_MINUTES)
            audit(db, actor_type="system", actor_id="auth", action="user.locked", entity_type="user", entity_id=user.id)
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    user.failed_logins = 0
    user.locked_until = None
    audit(db, actor_type="user", actor_id=user.id, action="user.login", entity_type="user", entity_id=user.id)
    db.commit()

    token, csrf = create_session_token(user)
    settings = get_settings()
    max_age = settings.jwt_ttl_minutes * 60
    response.set_cookie(SESSION_COOKIE, token, max_age=max_age, httponly=True, secure=settings.cookie_secure, samesite="strict", path="/")
    response.set_cookie(CSRF_COOKIE, csrf, max_age=max_age, httponly=False, secure=settings.cookie_secure, samesite="strict", path="/")
    return {"user": user_out(user), "csrf_token": csrf}


@router.post("/logout")
def logout(response: Response, user: User = Depends(get_current_user)) -> dict:
    response.delete_cookie(SESSION_COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return {"user": user_out(user)}
