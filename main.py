# main.py (Temporary Local Testing App)
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import Base, get_db
from app.api.auth import router as auth_router
from app.models.user import User
from app.core.security import get_password_hash
from app.core.middleware import SecurityHeadersMiddleware

# 1. Setup SQLite for local testing
from app.api.upload import router as upload_router
# main.py (Relevant parts)
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.scan import router as scan_router
from app.api.proposals import router as proposal_router

# Make sure Proposal model is imported in main.py so the table is created
from app.models.proposal import Proposal 
DATABASE_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db_override():
    async with async_session() as session:
        yield session

# 2. Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed a test user
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # Seed one user for testing
        from sqlalchemy.future import select
        result = await session.execute(select(User).where(User.email == "admin@demo.com"))
        if not result.scalars().first():
            user = User(
                email="admin@demo.com",
                hashed_password=get_password_hash("password123"),
                role="hr_admin"
            )
            session.add(user)
            await session.commit()
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(auth_router)
app.dependency_overrides[get_db] = get_db_override
app.include_router(upload_router)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(scan_router)


app.include_router(proposal_router)
