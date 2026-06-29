import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, String, DateTime, func, text
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

    id = Column(Integer, primary_key=True, autoincrement=True)
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


async def insert_feedback(data: dict):
    async with AsyncSessionLocal() as session:
        row = Feedback(**data)
        session.add(row)
        await session.commit()
