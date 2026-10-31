# app/core/dependencies.py
from fastapi import Request, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_access_token
from app.core.blacklist import is_token_revoked

# This extracts the token from the cookie
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    
    # Fallback to header if not in cookie (for API clients)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token has been revoked (logged out)")
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload

def require_role(allowed_roles: list[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Operation not permitted for your role")
        return user
    return role_checker

async def verify_csrf(request: Request):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        cookie_token = request.cookies.get("csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        
        if not cookie_token or not header_token or cookie_token != header_token:
            raise HTTPException(status_code=403, detail="CSRF token validation failed")