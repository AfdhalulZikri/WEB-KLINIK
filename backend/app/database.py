import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from .config import DATABASE_URL

_kwargs = {"pool_pre_ping": True}
if os.getenv("VERCEL"):
    # Serverless: jangan menahan koneksi antar-request (pooling diurus oleh Neon/Supabase).
    _kwargs["poolclass"] = NullPool

engine = create_engine(DATABASE_URL, **_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
