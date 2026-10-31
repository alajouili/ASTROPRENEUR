# app/core/middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Prevent XSS
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; object-src 'none';"
        # Prevent Clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Force HTTPS (only in prod, but good to show)
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Hide server details
        response.headers["Server"] = "Secure-HR-App"
        return response