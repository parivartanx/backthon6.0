import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import engine
from app.db.models import Base

if __name__ == "__main__":
    print("Preparing database...")
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
