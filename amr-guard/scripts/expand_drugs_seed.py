"""
Script to expand data/seed/drugs.csv with all 125 remaining FDA/WHO authorized antibiotics
from data/seed/antibiotic_180_usage_symptoms_fda_complete.csv and seed them into Neon PostgreSQL.
"""
import os
import sys
import csv

# Add workspace to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import engine, SessionLocal
from app.db.models import Drug
from scripts.build_antibiotic_profiles_md import classify_drug
from app.engine.constraints import (
    normalize_text,
    get_aware_tier,
    is_fluoroquinolone,
    is_tetracycline,
    is_aminoglycoside,
    PREGNANCY_CONTRAINDICATED_DRUGS,
)

def determine_drug_attributes(name: str, usage: str, symptoms: str) -> dict:
    norm = normalize_text(name)
    s_lower = symptoms.lower()
    u_lower = usage.lower()

    # Determine class
    d_class = classify_drug(name, usage)

    # Clean specific sub-class name
    if "penicillin" in norm or "amox" in norm or "amp" in norm or "clox" in norm:
        sub_class = "Penicillin"
        if "natural" in u_lower or any(p in norm for p in ["penicillin g", "penicillin v", "benzylpenicillin", "procaine", "benzathine"]):
            sub_class = "Natural Penicillin"
        elif "aminopenicillin" in d_class.lower():
            sub_class = "Aminopenicillin"
        elif "ureidopenicillin" in u_lower or "piperacillin" in norm:
            sub_class = "Ureidopenicillin"
        elif "carboxypenicillin" in u_lower or "ticarcillin" in norm or "carbenicillin" in norm:
            sub_class = "Carboxypenicillin"
        elif "penicillinase-resistant" in u_lower or any(k in norm for k in ["oxacillin", "nafcillin", "cloxacillin", "dicloxacillin", "flucloxacillin", "methicillin"]):
            sub_class = "Penicillinase-resistant Penicillin"
    elif any(k in norm for k in ["cef", "ceph"]):
        sub_class = "Cephalosporin"
        if any(k in norm for k in ["azolin", "alexin", "adroxil", "radine"]):
            sub_class = "First-gen Cephalosporin"
        elif any(k in norm for k in ["uroxime", "aclor", "prozil", "oxitin", "otetan"]):
            sub_class = "Second-gen Cephalosporin"
        elif any(k in norm for k in ["triaxone", "otaxime", "tazidime", "ixime", "podoxime", "dinir", "ditoren", "tibuten"]):
            sub_class = "Third-gen Cephalosporin"
        elif any(k in norm for k in ["epime", "pirome"]):
            sub_class = "Fourth-gen Cephalosporin"
        elif any(k in norm for k in ["taroline", "tobiprole", "iderocol"]):
            sub_class = "Fifth-gen / Siderophore Cephalosporin"
    elif "penem" in norm:
        sub_class = "Carbapenem"
    elif "aztreonam" in norm or "monobactam" in d_class.lower():
        sub_class = "Monobactam"
    elif is_fluoroquinolone(norm) or any(k in norm for k in ["floxacin", "nalidixic", "cinoxacin"]):
        sub_class = "Fluoroquinolone"
    elif is_tetracycline(norm) or "cycline" in norm:
        sub_class = "Tetracycline"
    elif is_aminoglycoside(norm) or any(k in norm for k in ["mycin", "micin"]) and any(k in norm for k in ["amikacin", "gentamicin", "tobramycin", "kanamycin", "neomycin", "streptomycin", "netilmicin", "plazomicin", "paromomycin", "spectinomycin", "arbekacin"]):
        sub_class = "Aminoglycoside"
    elif any(k in norm for k in ["vancomycin", "teicoplanin", "dalbavancin", "oritavancin", "telavancin"]):
        sub_class = "Glycopeptide"
    elif any(k in norm for k in ["colistin", "polymyxin"]):
        sub_class = "Polymyxin"
    elif any(k in norm for k in ["thromycin", "clarithromycin", "erythromycin", "azithromycin", "spiramycin", "telithromycin"]):
        sub_class = "Macrolide"
    elif any(k in norm for k in ["clindamycin", "lincomycin"]):
        sub_class = "Lincosamide"
    elif any(k in norm for k in ["linezolid", "tedizolid"]):
        sub_class = "Oxazolidinone"
    elif "daptomycin" in norm:
        sub_class = "Cyclic Lipopeptide"
    elif "nitrofurantoin" in norm:
        sub_class = "Nitrofuran"
    elif "fosfomycin" in norm:
        sub_class = "Phosphonic acid"
    elif any(k in norm for k in ["nidazole", "metronidazole", "tinidazole", "secnidazole"]):
        sub_class = "Nitroimidazole"
    elif "chloramphenicol" in norm:
        sub_class = "Amphenicol"
    else:
        sub_class = d_class.split(":")[0].strip()

    # Determine WHO AWaRe tier
    raw_aware = get_aware_tier(norm)
    if raw_aware in ["Access", "Watch", "Reserve"]:
        aware_class = raw_aware
    else:
        # Default tier inference by class
        if any(k in sub_class.lower() for k in ["natural penicillin", "aminopenicillin", "penicillinase-resistant", "first-gen cephalosporin", "tetracycline", "nitrofuran", "phosphonic", "nitroimidazole", "lincosamide", "amphenicol"]):
            aware_class = "Access"
        elif any(k in sub_class.lower() for k in ["second-gen cephalosporin", "third-gen cephalosporin", "fourth-gen cephalosporin", "fluoroquinolone", "macrolide", "glycopeptide"]):
            aware_class = "Watch"
        elif any(k in sub_class.lower() for k in ["carbapenem", "monobactam", "polymyxin", "oxazolidinone", "cyclic lipopeptide", "fifth-gen", "siderophore"]):
            aware_class = "Reserve"
        elif is_aminoglycoside(norm):
            aware_class = "Reserve" if "plazomicin" in norm else "Access"
        else:
            aware_class = "Access"

    fq = is_fluoroquinolone(norm)
    tc = is_tetracycline(norm)
    ag = is_aminoglycoside(norm)

    preg_contra = bool(
        fq or tc or ag
        or norm in PREGNANCY_CONTRAINDICATED_DRUGS
        or "teratogen" in s_lower
        or "fetal harm" in s_lower
        or "pregnancy" in s_lower and "contraindicated" in s_lower
    )

    min_age = 18.0 if (fq or tc) else 0.0

    nephro = bool(
        ag
        or any(k in norm for k in ["colistin", "polymyxin", "vancomycin", "telavancin", "bacitracin"])
        or "acute tubular necrosis" in s_lower
        or "nephrotoxic" in s_lower
    )

    req_egfr = bool(nephro or "nitrofurantoin" in norm)
    geriatric_contra = bool("nitrofurantoin" in norm)
    req_tdm = bool(ag or any(k in norm for k in ["vancomycin", "teicoplanin"]))
    iv_rest = bool(
        any(k in norm for k in ["penem", "colistin", "polymyxin", "vancomycin", "teicoplanin", "daptomycin", "tigecycline"])
        or "intravenous only" in u_lower
        or "iv only" in u_lower
    )

    return {
        "drug_class": sub_class,
        "is_antibiotic": True,
        "aware_class": aware_class,
        "is_fluoroquinolone": fq,
        "pregnancy_contraindicated": preg_contra,
        "min_age_years": min_age,
        "is_nephrotoxic": nephro,
        "requires_egfr": req_egfr,
        "min_egfr_safe": 30.0,
        "is_geriatric_contraindicated": geriatric_contra,
        "requires_tdm": req_tdm,
        "outpatient_iv_restricted": iv_rest,
    }

def main():
    base_dir = os.path.dirname(__file__)
    csv_180_path = os.path.join(base_dir, "..", "data", "seed", "antibiotic_180_usage_symptoms_fda_complete.csv")
    drugs_csv_path = os.path.join(base_dir, "..", "data", "seed", "drugs.csv")

    with open(csv_180_path, "r", encoding="utf-8") as f:
        fda_drugs = list(csv.DictReader(f))

    with open(drugs_csv_path, "r", encoding="utf-8") as f:
        existing_drugs = list(csv.DictReader(f))

    existing_names = {d["generic_name"].strip().lower() for d in existing_drugs}
    max_id = max(int(d["id"]) for d in existing_drugs) if existing_drugs else 0

    new_rows = []
    current_id = max_id + 1

    for row in fda_drugs:
        full_name = row["antibiotic_name"].strip()
        # Clean name if it has parenthetical alternate (e.g. "Amoxicillin-clavulanate (Co-amoxiclav)")
        clean_name = full_name.split("(")[0].strip()

        # Check if already in drugs table
        if clean_name.lower() in existing_names or full_name.lower() in existing_names:
            continue

        attrs = determine_drug_attributes(clean_name, row["usage"], row["symptoms"])

        new_record = {
            "id": current_id,
            "generic_name": clean_name,
            "drug_class": attrs["drug_class"],
            "is_antibiotic": attrs["is_antibiotic"],
            "aware_class": attrs["aware_class"],
            "is_fluoroquinolone": attrs["is_fluoroquinolone"],
            "pregnancy_contraindicated": attrs["pregnancy_contraindicated"],
            "min_age_years": attrs["min_age_years"],
            "is_nephrotoxic": attrs["is_nephrotoxic"],
            "requires_egfr": attrs["requires_egfr"],
            "min_egfr_safe": attrs["min_egfr_safe"],
            "is_geriatric_contraindicated": attrs["is_geriatric_contraindicated"],
            "requires_tdm": attrs["requires_tdm"],
            "outpatient_iv_restricted": attrs["outpatient_iv_restricted"],
        }

        new_rows.append(new_record)
        existing_names.add(clean_name.lower())
        current_id += 1

    print(f"Generated {len(new_rows)} new drug records from 180 FDA CSV.")

    # Write combined drugs.csv
    fieldnames = [
        "id", "generic_name", "drug_class", "is_antibiotic", "aware_class",
        "is_fluoroquinolone", "pregnancy_contraindicated", "min_age_years",
        "is_nephrotoxic", "requires_egfr", "min_egfr_safe",
        "is_geriatric_contraindicated", "requires_tdm", "outpatient_iv_restricted"
    ]

    all_drugs = existing_drugs + new_rows

    with open(drugs_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in all_drugs:
            writer.writerow(r)

    print(f"Updated {drugs_csv_path}: Total rows now {len(all_drugs)}.")

    # Now execute database seeding
    from scripts.seed_db import seed_database
    print("Executing database seeding...")
    seed_database()
    print("[SUCCESS] Relational database seeding complete!")

if __name__ == "__main__":
    main()
