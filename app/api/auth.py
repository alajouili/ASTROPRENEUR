# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import verify_password, create_access_token, generate_csrf_token
from app.models.user import User
from app.database import get_db  # <--- FIXED: Uncommented this line
from app.core.dependencies import get_current_user
from app.core.blacklist import revoke_token
router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

# --- LOGIN ENDPOINT ---
@router.post("/login")
@limiter.limit("5/minute") # Rate limit: max 5 attempts per minute per IP
async def login(
    response: Response, 
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db) 
):
    # 1. Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # 2. Check Lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Account locked due to too many failed attempts.")

    # 3. Verify Password
    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # 4. Success: Reset attempts, issue tokens
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    csrf_token = generate_csrf_token()

    # 5. Set HttpOnly Cookies (Secure against XSS)
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, # JavaScript cannot read this
        samesite="lax", # Protects against CSRF
        secure=False # Set to True in production (HTTPS)
    )
    response.set_cookie(
        key="csrf_token", 
        value=csrf_token, 
        httponly=False, # Frontend MUST read this to send in headers
        samesite="lax",
        secure=False
    )
    
    return {"message": "Login successful", "role": user.role}

# --- LOGOUT ENDPOINT ---
@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("access_token")
    if token:
        revoke_token(token) # Add to blacklist
        
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")
    return {"message": "Logged out securely"}                       

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Returns the current logged-in user's info based on the JWT."""
    return {"user_id": user.get("sub"), "role": user.get("role")}