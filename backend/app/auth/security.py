"""Authentication: password hashing, session tokens, CSRF, role checks.

- Passwords: argon2id via pwdlib.
- Session: short-lived JWT in an httpOnly, SameSite=Strict cookie (not readable by JS).
- CSRF: double submit. The JWT carries a random csrf value that is also set in a
  readable cookie; every state-changing request must echo it in X-CSRF-Token.
- Roles are checked on the server for every route (require_roles).
"""
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, status
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import User

SESSION_COOKIE = "trusthr_session"
CSRF_COOKIE = "trusthr_csrf"
CSRF_HEADER = "X-CSRF-Token"
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _hasher.verify(password, password_hash)


def create_session_token(user: User) -> tuple[str, str]:
    settings = get_settings()
    csrf = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    claims = {
        "sub": user.id,
        "role": user.role,
        "csrf": csrf,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_ttl_minutes),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm="HS256"), csrf


def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"], options={"require": ["exp", "sub"]})
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    claims = _decode(token)
    if request.method not in _SAFE_METHODS:
        sent = request.headers.get(CSRF_HEADER, "")
        if not sent or not secrets.compare_digest(sent, claims.get("csrf", "")):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF check failed")
    user = db.get(User, claims["sub"])
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return user


def require_roles(*roles: str):
    """Dependency factory: the current user must have one of `roles`."""

    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your role is not allowed to do this")
        return user

    return _dep


HR_ROLES = ("recruiter", "hr_admin")
