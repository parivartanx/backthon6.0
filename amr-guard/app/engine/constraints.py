"""
Ontological constraints, drug classifications, and standard treatment guideline
constants for AMR-Guard deterministic verification pipeline.
"""
from typing import Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Tier 1: Contraindication Constants
# ---------------------------------------------------------------------------

PEDIATRIC_FLUOROQUINOLONES: Set[str] = {
    "ciprofloxacin",
    "levofloxacin",
    "ofloxacin",
    "norfloxacin",
    "moxifloxacin",
    "gemifloxacin",
    "pefloxacin",
    "lomefloxacin",
    "sparfloxacin",
    "norflox",
    "ciproflox",
    "levoflox",
    "oflox",
    "moxiflox",
}

PEDIATRIC_TETRACYCLINES: Set[str] = {
    "doxycycline",
    "tetracycline",
    "minocycline",
    "oxytetracycline",
    "demeclocycline",
}

PREGNANCY_CONTRAINDICATED_DRUGS: Set[str] = {
    "doxycycline",
    "tetracycline",
    "minocycline",
    "ciprofloxacin",
    "levofloxacin",
    "ofloxacin",
    "norfloxacin",
    "moxifloxacin",
    "amikacin",
    "gentamicin",
    "tobramycin",
    "streptomycin",
    "kanamycin",
    "clarithromycin",
}

# [PATTERN: Domain Data Structure] — Canonical allergy class drug registries
PENICILLIN_DRUGS: Set[str] = {
    "amoxicillin",
    "ampicillin",
    "piperacillin",
    "cloxacillin",
    "oxacillin",
    "penicillin v",
    "penicillin",
    "benzylpenicillin",
    "amox-clav",
    "amoxicillin-clavulanate",
    "amoxicillin + clavulanic acid",
    "co-amoxiclav",
    "tazobactam",
    "piperacillin-tazobactam",
    "piperacillin + tazobactam",
    "methicillin",
    "flucloxacillin",
}

CEPHALOSPORIN_DRUGS: Set[str] = {
    "cefixime",
    "ceftriaxone",
    "cefuroxime",
    "cefuroxime axetil",
    "cefpodoxime",
    "cefalexin",
    "cephalexin",
    "cefazolin",
    "cefadroxil",
    "cefaclor",
    "cefdinir",
    "cefepime",
    "cefotaxime",
    "ceftaroline",
    "ceftazidime",
    "cefprozil",
    "cefoperazone",
    "cefiderocol",
}

CARBAPENEM_DRUGS: Set[str] = {
    "meropenem",
    "imipenem",
    "imipenem-cilastatin",
    "ertapenem",
    "doripenem",
}

SULFA_DRUGS: Set[str] = {
    "co-trimoxazole",
    "cotrimoxazole",
    "trimethoprim-sulfamethoxazole",
    "trimethoprim + sulfamethoxazole",
    "sulfamethoxazole",
    "bactrim",
    "septra",
    "sulfamethoxazole-trimethoprim",
    "sulfadiazine",
    "sulfasalazine",
}

MACROLIDE_DRUGS: Set[str] = {
    "azithromycin",
    "clarithromycin",
    "erythromycin",
    "roxithromycin",
}

# [PATTERN: Domain Data Structure] — Authoritative pediatric weight-based daily dose ceilings (mg/kg/day)
# Sources: ICMR Treatment Guidelines for Antimicrobials in Pediatrics 2023 & WHO Model Formulary for Children
PEDIATRIC_DAILY_DOSE_CEILINGS_MG_KG: dict[str, float] = {
    "amoxicillin": 100.0,
    "amoxicillin-clavulanate": 90.0,
    "amox-clav": 90.0,
    "amoxicillin + clavulanic acid": 90.0,
    "cefixime": 16.0,
    "azithromycin": 20.0,
}


# ---------------------------------------------------------------------------
# Tier 2: Viral / Self-Limiting Syndromes & Irrational FDCs
# ---------------------------------------------------------------------------

VIRAL_SELF_LIMITING_SYNDROMES: Set[str] = {
    "acute bronchitis",
    "common cold",
    "viral urti",
    "pharyngitis without strep criteria",
    "acute watery diarrhea",
    "syn_acute_bronchitis",
    "syn_common_cold",
    "syn_viral_urti",
    "syn_pharyngitis_non_strep",
    "syn_watery_diarrhea",
}

IRRATIONAL_FDC_PAIRS: list[tuple[str, str]] = [
    ("ofloxacin", "ornidazole"),
    ("cefixime", "azithromycin"),
    ("ciprofloxacin", "tinidazole"),
    ("norfloxacin", "tinidazole"),
    ("norfloxacin", "metronidazole"),
    ("metronidazole", "ofloxacin"),
    ("cefpodoxime", "azithromycin"),
    ("amoxicillin", "bromhexine"),
]

# ---------------------------------------------------------------------------
# Tier 3: WHO AWaRe Classification Registry
# ---------------------------------------------------------------------------

AWARE_ACCESS_DRUGS: Set[str] = {
    "amoxicillin",
    "amoxicillin + clavulanic acid",
    "amoxicillin-clavulanate",
    "amox-clav",
    "ampicillin",
    "benzathine benzylpenicillin",
    "benzylpenicillin",
    "cefalexin",
    "cephalexin",
    "cefazolin",
    "cefadroxil",
    "chloramphenicol",
    "clindamycin",
    "cloxacillin",
    "doxycycline",
    "gentamicin",
    "amikacin",
    "tobramycin",
    "streptomycin",
    "kanamycin",
    "metronidazole",
    "tinidazole",
    "ornidazole",
    "nitrofurantoin",
    "phenoxymethylpenicillin",
    "penicillin v",
    "co-trimoxazole",
    "trimethoprim + sulfamethoxazole",
    "cotrimoxazole",
    "sulfamethoxazole-trimethoprim",
    "trimethoprim",
    "fosfomycin",  # oral sachet for uncomplicated UTI
}

AWARE_WATCH_DRUGS: Set[str] = {
    "azithromycin",
    "cefaclor",
    "cefepime",
    "cefixime",
    "cefotaxime",
    "cefpodoxime",
    "ceftaroline",
    "ceftazidime",
    "ceftriaxone",
    "cefuroxime",
    "cefuroxime axetil",
    "cefdinir",
    "cefprozil",
    "cefoperazone",
    "cefoperazone-sulbactam",
    "cefoperazone + sulbactam",
    "ciprofloxacin",
    "clarithromycin",
    "erythromycin",
    "roxithromycin",
    "levofloxacin",
    "moxifloxacin",
    "gemifloxacin",
    "norfloxacin",
    "ofloxacin",
    "piperacillin + tazobactam",
    "piperacillin-tazobactam",
    "teicoplanin",
    "vancomycin",
}

AWARE_RESERVE_DRUGS: Set[str] = {
    "cefiderocol",
    "ceftazidime + avibactam",
    "ceftazidime-avibactam",
    "ceftolozane + tazobactam",
    "ceftolozane-tazobactam",
    "colistin",
    "fosfomycin iv",
    "linezolid",
    "meropenem",
    "imipenem",
    "imipenem-cilastatin",
    "ertapenem",
    "doripenem",
    "tedizolid",
    "daptomycin",
    "polymyxin b",
    "tigecycline",
    "plazomicin",
    "aztreonam",
    "meropenem-vaborbactam",
}



# Syndromes that have established Access first-line alternatives
SYNDROMES_WITH_ACCESS_FIRST_LINE = {
    "syn_cap_mild": "Amoxicillin (500mg TID for 5 days)",
    "cap mild": "Amoxicillin (500mg TID for 5 days)",
    "community-acquired pneumonia (mild)": "Amoxicillin (500mg TID for 5 days)",
    "syn_uncomplicated_uti": "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single sachet)",
    "uncomplicated lower uti": "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single sachet)",
    "cystitis": "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single sachet)",
    "syn_pharyngitis_strep": "Penicillin V or Amoxicillin",
    "strep pharyngitis": "Penicillin V or Amoxicillin",
    "syn_aom": "Amoxicillin",
    "acute otitis media": "Amoxicillin",
    "skin and soft tissue infection": "Cloxacillin or Cefalexin",
}

# ---------------------------------------------------------------------------
# Helper Normalization Functions
# ---------------------------------------------------------------------------

def normalize_text(text: Optional[str]) -> str:
    """Lowercase and strip whitespace for robust matching."""
    if not text:
        return ""
    return text.strip().lower()

def is_fluoroquinolone(drug_name: str) -> bool:
    """Check if drug is a fluoroquinolone."""
    norm = normalize_text(drug_name)
    return any(fq in norm for fq in PEDIATRIC_FLUOROQUINOLONES)

def is_tetracycline(drug_name: str) -> bool:
    """Check if drug is a tetracycline."""
    norm = normalize_text(drug_name)
    return any(tc in norm for tc in PEDIATRIC_TETRACYCLINES)

def is_aminoglycoside(drug_name: str) -> bool:
    """Check if drug is an aminoglycoside."""
    norm = normalize_text(drug_name)
    aminos = {"amikacin", "gentamicin", "tobramycin", "streptomycin", "kanamycin"}
    return any(am in norm for am in aminos)

# [PATTERN: Domain Data Structure] — Systemic NSAID registry for therapeutic duplication detection
NSAID_DRUGS: Set[str] = {
    "diclofenac",
    "diclofenac sodium",
    "diclofenac potassium",
    "ibuprofen",
    "naproxen",
    "ketorolac",
    "piroxicam",
    "indomethacin",
    "meloxicam",
    "mefenamic acid",
    "etoricoxib",
    "celecoxib",
    "aceclofenac",
    "ketoprofen",
    "nimesulide",
}

def is_nsaid_drug(drug_name: str) -> bool:
    """Check if drug is a systemic non-steroidal anti-inflammatory drug (NSAID)."""
    norm = normalize_text(drug_name)
    return any(nsaid in norm for nsaid in NSAID_DRUGS)


def is_antibiotic_drug(drug_name: str) -> bool:
    """Check if the drug entity is an antimicrobial agent rather than supportive therapy."""
    norm = normalize_text(drug_name)
    if is_nsaid_drug(drug_name):
        return False
    non_antibiotics = {
        "paracetamol", "acetaminophen", "dolo", "calpol", "crocin",
        "cetirizine", "cetzine", "alerid", "levocetirizine", "1-al",
        "ibuprofen", "combiflam", "brufen", "salbutamol", "asthalin",
        "ors", "oral rehydration", "zinc", "zinc sulfate", "electral",
        "dextromethorphan", "saline", "normal saline", "pantoprazole",
        "omeprazole", "ranitidine", "ondansetron", "chlorpheniramine",
        "diclofenac", "voveran", "aceclofenac", "zerodol",
    }
    if any(na in norm for na in non_antibiotics):
        return False
    return (
        any(r in norm for r in AWARE_RESERVE_DRUGS)
        or any(w in norm for w in AWARE_WATCH_DRUGS)
        or any(a in norm for a in AWARE_ACCESS_DRUGS)
        or is_fluoroquinolone(drug_name)
        or is_tetracycline(drug_name)
        or is_aminoglycoside(drug_name)
    )


def get_aware_tier(drug_name: str, fallback_tier: Optional[str] = None) -> str:
    """
    Determine the WHO AWaRe classification tier.
    WHO AWaRe strictly applies to antibacterial agents.
    Non-antimicrobial supportive drugs (NSAIDs, analgesics, antihistamines) return 'Not Applicable'.
    """
    if fallback_tier and fallback_tier.capitalize() in {"Access", "Watch", "Reserve"}:
        return fallback_tier.capitalize()

    norm = normalize_text(drug_name)

    # Check Reserve first
    for r in AWARE_RESERVE_DRUGS:
        if r in norm:
            return "Reserve"

    # Check Watch
    for w in AWARE_WATCH_DRUGS:
        if w in norm:
            return "Watch"

    # Check Access
    for a in AWARE_ACCESS_DRUGS:
        if a in norm:
            return "Access"

    # Non-antimicrobial supportive drugs do not belong to WHO AWaRe framework
    if is_nsaid_drug(drug_name) or not is_antibiotic_drug(drug_name):
        return "Not Applicable"

    return "Unclassified"

def is_irrational_fdc(drug_name: str) -> bool:
    """Check if the formulation matches an irrational fixed-dose combination."""
    norm = normalize_text(drug_name)
    for part1, part2 in IRRATIONAL_FDC_PAIRS:
        if part1 in norm and part2 in norm:
            return True
    return False


# [SOLID: SRP] — Drug family classification helpers for allergy & safety verification
def is_penicillin_drug(drug_name: str) -> bool:
    """Check if drug is a penicillin-class antimicrobial."""
    norm = normalize_text(drug_name)
    return any(p in norm for p in PENICILLIN_DRUGS)

def is_cephalosporin_drug(drug_name: str) -> bool:
    """Check if drug is a cephalosporin-class antimicrobial."""
    norm = normalize_text(drug_name)
    if norm.startswith("cef") or norm.startswith("ceph") or " cef" in norm or "-cef" in norm:
        return True
    return any(c in norm for c in CEPHALOSPORIN_DRUGS)

def is_carbapenem_drug(drug_name: str) -> bool:
    """Check if drug is a carbapenem-class antimicrobial."""
    norm = normalize_text(drug_name)
    return any(c in norm for c in CARBAPENEM_DRUGS)

def is_sulfa_drug(drug_name: str) -> bool:
    """Check if drug is a sulfonamide-class antimicrobial."""
    norm = normalize_text(drug_name)
    return any(s in norm for s in SULFA_DRUGS)

def is_macrolide_drug(drug_name: str) -> bool:
    """Check if drug is a macrolide-class antimicrobial."""
    norm = normalize_text(drug_name)
    return any(m in norm for m in MACROLIDE_DRUGS)



