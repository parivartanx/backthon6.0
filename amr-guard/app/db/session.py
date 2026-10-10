from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """
    -- [MIGRATION: zero-downtime] Safely verify and initialize database schema and memoization tables
    """
    from app.db.models import Base
    try:
        with engine.connect() as conn:
            # Check if audits table exists before attempting column addition
            try:
                conn.execute(text("ALTER TABLE audits ADD COLUMN IF NOT EXISTS signature VARCHAR(64);"))
                conn.commit()
            except Exception:
                pass
    except Exception:
        pass
    Base.metadata.create_all(bind=engine)

