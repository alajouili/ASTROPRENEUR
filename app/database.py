# app/database.py
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession

Base = declarative_base()

# This is a placeholder. Member 1 will replace this with the real Postgres get_db
async def get_db() -> AsyncSession:
    pass