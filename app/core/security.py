# app/core/security.py
import os
import jwt
import secrets
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash

# Argon2id is the current industry standard (winner of Password Hashing Competition)
password_hash = PasswordHash.recommended()

JWT_SECRET = os.getenv("JWT_SECRET", "fallback_secret_do_not_use_in_prod")
JWT_ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60) # 1 hour expiry
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

def generate_csrf_token() -> str:
    # A cryptographically secure random string
    return secrets.token_hex(32)