import os
import sys
import csv

# Ensure root directory is on Python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text, select
from app.db.session import engine, SessionLocal
from app.db.models import Base, Condition, Drug, Regimen, Brand, Guideline

def seed_database():
    print("Preparing database tables...")
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            # Ensure new columns exist on drugs table
            new_cols = [
                ("is_nephrotoxic", "BOOLEAN DEFAULT FALSE"),
                ("requires_egfr", "BOOLEAN DEFAULT FALSE"),
                ("min_egfr_safe", "FLOAT DEFAULT 30.0"),
                ("is_geriatric_contraindicated", "BOOLEAN DEFAULT FALSE"),
                ("requires_tdm", "BOOLEAN DEFAULT FALSE"),
                ("outpatient_iv_restricted", "BOOLEAN DEFAULT FALSE"),
            ]
            for col_name, col_type in new_cols:
                try:
                    conn.execute(text(f"ALTER TABLE drugs ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                except Exception as col_err:
                    print(f"Notice: column {col_name}: {col_err}")
            conn.commit()
    except Exception as e:
        print(f"Notice: table migration check: {e}")

    Base.metadata.create_all(bind=engine)
    print("Tables verified.")

    db = SessionLocal()
    seed_dir = os.path.join(os.path.dirname(__file__), "..", "data", "seed")

    try:
        # 1. Seed Conditions
        cond_csv = os.path.join(seed_dir, "conditions.csv")
        if os.path.exists(cond_csv):
            count_cond = 0
            with open(cond_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_id = int(row["id"])
                    existing = db.execute(select(Condition).where(Condition.id == c_id)).scalar_one_or_none()
                    if not existing:
                        existing = db.execute(select(Condition).where(Condition.code == row["code"])).scalar_one_or_none()
                    
                    if existing:
                        existing.code = row["code"]
                        existing.display_name = row["display_name"]
                    else:
                        db.add(Condition(
                            id=c_id,
                            code=row["code"],
                            display_name=row["display_name"]
                        ))
                    count_cond += 1
            db.commit()
            print(f"Conditions seeded/updated: {count_cond} total.")

        # 2. Seed Drugs
        drugs_csv = os.path.join(seed_dir, "drugs.csv")
        if os.path.exists(drugs_csv):
            count_drugs = 0
            with open(drugs_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    d_id = int(row["id"])
                    existing = db.execute(select(Drug).where(Drug.id == d_id)).scalar_one_or_none()
                    if not existing:
                        existing = db.execute(select(Drug).where(Drug.generic_name == row["generic_name"])).scalar_one_or_none()

                    if existing:
                        existing.generic_name = row["generic_name"]
                        existing.drug_class = row["drug_class"]
                        existing.is_antibiotic = row["is_antibiotic"].lower() == "true"
                        existing.aware_class = row["aware_class"]
                        existing.is_fluoroquinolone = row["is_fluoroquinolone"].lower() == "true"
                        existing.pregnancy_contraindicated = row["pregnancy_contraindicated"].lower() == "true"
                        existing.min_age_years = float(row["min_age_years"])
                        existing.is_nephrotoxic = row.get("is_nephrotoxic", "False").lower() == "true"
                        existing.requires_egfr = row.get("requires_egfr", "False").lower() == "true"
                        existing.min_egfr_safe = float(row.get("min_egfr_safe", "30.0") or 30.0)
                        existing.is_geriatric_contraindicated = row.get("is_geriatric_contraindicated", "False").lower() == "true"
                        existing.requires_tdm = row.get("requires_tdm", "False").lower() == "true"
                        existing.outpatient_iv_restricted = row.get("outpatient_iv_restricted", "False").lower() == "true"
                    else:
                        db.add(Drug(
                            id=d_id,
                            generic_name=row["generic_name"],
                            drug_class=row["drug_class"],
                            is_antibiotic=row["is_antibiotic"].lower() == "true",
                            aware_class=row["aware_class"],
                            is_fluoroquinolone=row["is_fluoroquinolone"].lower() == "true",
                            pregnancy_contraindicated=row["pregnancy_contraindicated"].lower() == "true",
                            min_age_years=float(row["min_age_years"]),
                            is_nephrotoxic=row.get("is_nephrotoxic", "False").lower() == "true",
                            requires_egfr=row.get("requires_egfr", "False").lower() == "true",
                            min_egfr_safe=float(row.get("min_egfr_safe", "30.0") or 30.0),
                            is_geriatric_contraindicated=row.get("is_geriatric_contraindicated", "False").lower() == "true",
                            requires_tdm=row.get("requires_tdm", "False").lower() == "true",
                            outpatient_iv_restricted=row.get("outpatient_iv_restricted", "False").lower() == "true",
                        ))
                    count_drugs += 1
            db.commit()
            print(f"Drugs seeded/updated: {count_drugs} total.")

        # 3. Seed Regimens
        regimens_csv = os.path.join(seed_dir, "regimens.csv")
        if os.path.exists(regimens_csv):
            count_regimens = 0
            with open(regimens_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    r_id = int(row["id"])
                    existing = db.execute(select(Regimen).where(Regimen.id == r_id)).scalar_one_or_none()
                    if existing:
                        existing.condition_id = int(row["condition_id"])
                        existing.drug_id = int(row["drug_id"])
                        existing.dose_text = row["dose_text"]
                        existing.frequency = row["frequency"]
                        existing.duration_days = int(row["duration_days"])
                        existing.source = row["source"]
                        existing.verified_by = row["verified_by"]
                    else:
                        db.add(Regimen(
                            id=r_id,
                            condition_id=int(row["condition_id"]),
                            drug_id=int(row["drug_id"]),
                            dose_text=row["dose_text"],
                            frequency=row["frequency"],
                            duration_days=int(row["duration_days"]),
                            source=row["source"],
                            verified_by=row["verified_by"]
                        ))
                    count_regimens += 1
            db.commit()
            print(f"Regimens seeded/updated: {count_regimens} total.")

        # 4. Seed Brands
        brands_csv = os.path.join(seed_dir, "brands.csv")
        if os.path.exists(brands_csv):
            count_brands = 0
            with open(brands_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    b_id = int(row["id"])
                    existing = db.execute(select(Brand).where(Brand.id == b_id)).scalar_one_or_none()
                    if not existing:
                        existing = db.execute(select(Brand).where(Brand.brand_name == row["brand_name"])).scalar_one_or_none()

                    if existing:
                        existing.brand_name = row["brand_name"]
                        existing.drug_id = int(row["drug_id"])
                        existing.default_strength = row["default_strength"]
                    else:
                        db.add(Brand(
                            id=b_id,
                            brand_name=row["brand_name"],
                            drug_id=int(row["drug_id"]),
                            default_strength=row["default_strength"]
                        ))
                    count_brands += 1
            db.commit()
            print(f"Brands seeded/updated: {count_brands} total.")

        # 5. Seed Guidelines
        guidelines_csv = os.path.join(seed_dir, "guidelines.csv")
        if os.path.exists(guidelines_csv):
            count_guidelines = 0
            with open(guidelines_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    g_id = int(row["id"])
                    existing = db.execute(select(Guideline).where(Guideline.id == g_id)).scalar_one_or_none()
                    if existing:
                        existing.condition_id = int(row["condition_id"])
                        existing.source = row["source"]
                        existing.section_ref = row["section_ref"]
                        existing.summary = row["summary"]
                        existing.antibiotic_indicated = row["antibiotic_indicated"].lower() == "true"
                    else:
                        db.add(Guideline(
                            id=g_id,
                            condition_id=int(row["condition_id"]),
                            source=row["source"],
                            section_ref=row["section_ref"],
                            summary=row["summary"],
                            antibiotic_indicated=row["antibiotic_indicated"].lower() == "true"
                        ))
                    count_guidelines += 1
            db.commit()
            print(f"Guidelines seeded/updated: {count_guidelines} total.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
