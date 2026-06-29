import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, String, DateTime, func, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_async_engine(DATABASE_URL, echo=False)
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
