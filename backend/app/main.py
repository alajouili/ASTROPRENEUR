"""FastAPI application."""
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import assistant, audit, auth, inbox, jobs, proposals, scan, scheduling
from app.config import get_settings
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db()
    stop = threading.Event()
    if settings.embedded_worker:
        from app.worker.runner import start_embedded

        start_embedded(stop)
    yield
    stop.set()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="TrustHR AI", version="0.1.0", lifespan=lifespan,
                  docs_url="/api/docs" if settings.app_env != "prod" else None, openapi_url="/api/openapi.json")

    app.add_middleware(
        CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True,
        allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-CSRF-Token"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        if not request.url.path.startswith("/api/docs"):
            response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        response.headers.setdefault("Cache-Control", "no-store")
        return response

    @app.get("/api/health")
    def health() -> dict:
        from app.agents.screening.engines import build_engine

        return {"status": "ok", "screening_engine": build_engine(settings).label,
                "prompt_guard": settings.prompt_guard_mode}

    for router in (auth.router, jobs.router, proposals.router, audit.router, scan.router, inbox.router, scheduling.router, assistant.router):
        app.include_router(router)
    return app


app = create_app()
