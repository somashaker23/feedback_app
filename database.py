import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

from urllib.parse import urlparse, urlunparse

_raw_url = os.environ["DATABASE_URL"]
# Neon gives postgresql://...?sslmode=require&channel_binding=require
# asyncpg needs the +asyncpg dialect and SSL via connect_args — strip all query params.
_parsed = urlparse(_raw_url)
DATABASE_URL = urlunparse(_parsed._replace(
    scheme="postgresql+asyncpg",
    query="",
))

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"ssl": True})
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Feedback(Base):
    __tablename__ = "feedback"
    __table_args__ = (UniqueConstraint("submission_id", name="uq_feedback_submission_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(String(36), nullable=False)
    name = Column(String(50), nullable=True)
    reliability_rating = Column(Integer, nullable=False)
    reliability_comment = Column(String(1000), nullable=True)
    receptivity_rating = Column(Integer, nullable=False)
    receptivity_comment = Column(String(1000), nullable=True)
    energy_rating = Column(Integer, nullable=False)
    blind_spot = Column(String(1000), nullable=False)
    future_skill = Column(String(1000), nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent migration for tables created before submission_id was added.
        await conn.execute(text(
            "ALTER TABLE feedback ADD COLUMN IF NOT EXISTS submission_id VARCHAR(36)"
        ))
        await conn.execute(text("""
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_feedback_submission_id'
              ) THEN
                ALTER TABLE feedback
                  ADD CONSTRAINT uq_feedback_submission_id UNIQUE (submission_id);
              END IF;
            END $$
        """))


async def upsert_feedback(data: dict):
    stmt = pg_insert(Feedback).values(**data)
    # submission_id is the conflict key — exclude it from the SET clause.
    # submitted_at uses server_default and is not in data, so it is never
    # overwritten on conflict; the edit-window anchor stays fixed. ✓
    update_cols = {k: stmt.excluded[k] for k in data if k != 'submission_id'}
    stmt = stmt.on_conflict_do_update(
        constraint='uq_feedback_submission_id',
        set_=update_cols,
    )
    async with AsyncSessionLocal() as session:
        await session.execute(stmt)
        await session.commit()
