import os
import sys
import csv

# Ensure root directory is on Python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text, select
from app.db.session import engine, SessionLocal
from app.db.models import Base, Condition, Drug, Regimen

def seed_database():
    print("Preparing database tables...")
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
    except Exception as e:
        print(f"Notice: vector extension check: {e}")

    Base.metadata.create_all(bind=engine)
    print("Tables verified.")

    db = SessionLocal()
    seed_dir = os.path.join(os.path.dirname(__file__), "..", "data", "seed")

    try:
        # 1. Seed Conditions
        cond_csv = os.path.join(seed_dir, "conditions.csv")
        if os.path.exists(cond_csv):
            with open(cond_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing = db.execute(select(Condition).where(Condition.code == row["code"])).scalar_one_or_none()
                    if not existing:
                        db.add(Condition(
                            id=int(row["id"]),
                            code=row["code"],
                            display_name=row["display_name"]
                        ))
            db.commit()
            print("Conditions seeded.")

        # 2. Seed Drugs
        drugs_csv = os.path.join(seed_dir, "drugs.csv")
        if os.path.exists(drugs_csv):
            with open(drugs_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing = db.execute(select(Drug).where(Drug.generic_name == row["generic_name"])).scalar_one_or_none()
                    if not existing:
                        db.add(Drug(
                            id=int(row["id"]),
                            generic_name=row["generic_name"],
                            drug_class=row["drug_class"],
                            is_antibiotic=row["is_antibiotic"].lower() == "true",
                            aware_class=row["aware_class"],
                            is_fluoroquinolone=row["is_fluoroquinolone"].lower() == "true",
                            pregnancy_contraindicated=row["pregnancy_contraindicated"].lower() == "true",
                            min_age_years=float(row["min_age_years"])
                        ))
            db.commit()
            print("Drugs seeded.")

        # 3. Seed Regimens
        regimens_csv = os.path.join(seed_dir, "regimens.csv")
        if os.path.exists(regimens_csv):
            with open(regimens_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing = db.execute(select(Regimen).where(Regimen.id == int(row["id"]))).scalar_one_or_none()
                    if not existing:
                        db.add(Regimen(
                            id=int(row["id"]),
                            condition_id=int(row["condition_id"]),
                            drug_id=int(row["drug_id"]),
                            dose_text=row["dose_text"],
                            frequency=row["frequency"],
                            duration_days=int(row["duration_days"]),
                            source=row["source"],
                            verified_by=row["verified_by"]
                        ))
            db.commit()
            print("Regimens seeded.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
