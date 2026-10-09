"""
Script to populate FDA approved usage and side-effects/warnings for all drugs in AMR-Guard
from antibiotic_usage_side_effects_fda_starter.csv and antibiotic_180_usage_symptoms_fda_complete.csv.
"""
import os
import sys
import csv

# Add root directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.engine.constraints import normalize_text
from scripts.seed_db import seed_database
from app.services.knowledge_service import ingest_file_content

def build_profile_catalog():
    base_dir = os.path.join(os.path.dirname(__file__), "..", "data", "seed")
    starter_path = os.path.join(base_dir, "antibiotic_usage_side_effects_fda_starter.csv")
    complete_path = os.path.join(base_dir, "antibiotic_180_usage_symptoms_fda_complete.csv")

    catalog = {}

    # 1. First load complete 180 as baseline
    if os.path.exists(complete_path):
        with open(complete_path, "r", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                name = r["antibiotic_name"].strip()
                norm = normalize_text(name.split("(")[0])
                catalog[norm] = {
                    "usage": r["usage"].strip(),
                    "side_effects": r["symptoms"].strip(),
                }

    # 2. Overlay curated starter dataset (highest priority)
    if os.path.exists(starter_path):
        with open(starter_path, "r", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                name = r["antibiotic_name"].strip()
                norm = normalize_text(name.split("(")[0].replace("/", "-"))
                # Also index original
                catalog[norm] = {
                    "usage": r["usage"].strip(),
                    "side_effects": r["symptoms"].strip(),
                }
                # Also handle direct amox-clav or pip-tazo
                catalog[normalize_text(name)] = {
                    "usage": r["usage"].strip(),
                    "side_effects": r["symptoms"].strip(),
                }

    return catalog

def find_profile(generic_name: str, catalog: dict) -> tuple[str, str]:
    norm = normalize_text(generic_name)
    if norm in catalog:
        return catalog[norm]["usage"], catalog[norm]["side_effects"]

    # Fuzzy/alias search
    for key, val in catalog.items():
        if key in norm or norm in key:
            return val["usage"], val["side_effects"]

    # Specific common clinical combinations
    if "amoxicillin-clavulanate" in norm or "co-amoxiclav" in norm:
        for k in ["amoxicillin/clavulanate", "amoxicillin-clavulanate"]:
            if k in catalog:
                return catalog[k]["usage"], catalog[k]["side_effects"]
    if "piperacillin-tazobactam" in norm:
        for k in ["piperacillin/tazobactam", "piperacillin-tazobactam"]:
            if k in catalog:
                return catalog[k]["usage"], catalog[k]["side_effects"]
    if "co-trimoxazole" in norm or "cotrimoxazole" in norm or "trimethoprim" in norm:
        for k in ["trimethoprim/sulfamethoxazole", "trimethoprim-sulfamethoxazole"]:
            if k in catalog:
                return catalog[k]["usage"], catalog[k]["side_effects"]

    return "", ""

def main():
    catalog = build_profile_catalog()
    print(f"Loaded {len(catalog)} normalized antibiotic profiles from starter + complete CSVs.")

    drugs_csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed", "drugs.csv")
    with open(drugs_csv_path, "r", encoding="utf-8-sig") as f:
        drugs = list(csv.DictReader(f))

    updated_count = 0
    for d in drugs:
        g_name = d["generic_name"].strip()
        usage, side_effects = find_profile(g_name, catalog)
        d["usage"] = usage
        d["side_effects"] = side_effects
        if usage:
            updated_count += 1

    print(f"Matched and populated usage & side effects for {updated_count} / {len(drugs)} drugs.")

    fieldnames = [
        "id", "generic_name", "drug_class", "is_antibiotic", "aware_class",
        "is_fluoroquinolone", "pregnancy_contraindicated", "min_age_years",
        "is_nephrotoxic", "requires_egfr", "min_egfr_safe",
        "is_geriatric_contraindicated", "requires_tdm", "outpatient_iv_restricted",
        "usage", "side_effects"
    ]

    with open(drugs_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for d in drugs:
            writer.writerow(d)

    print(f"Successfully rewritten {drugs_csv_path} with usage and side_effects columns.")

    # Re-seed database
    print("\nExecuting database seeding into Neon PostgreSQL...")
    seed_database()

    # Also vectorize starter file into knowledge_chunks
    starter_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed", "antibiotic_usage_side_effects_fda_starter.csv")
    with open(starter_path, "rb") as f:
        starter_bytes = f.read()

    print("\nIngesting starter dataset into pgvector knowledge_chunks...")
    res = ingest_file_content(
        filename="antibiotic_usage_side_effects_fda_starter.csv",
        raw_bytes=starter_bytes,
        target_chunk_size=1000,
    )
    print(f"[OK] Ingested {res.chunks_created} chunks into pgvector under source: {res.source_id}")

    print("\n[SUCCESS] All antibiotic usages, symptoms, and side effects seeded and vectorized!")

if __name__ == "__main__":
    main()
