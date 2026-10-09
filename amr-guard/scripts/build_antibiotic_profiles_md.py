"""
Generator script to compile the 180 FDA/WHO verified antibiotic records into a high-density,
structure-aware clinical knowledge compendium: ANTIBIOTIC_SAFETY_PROFILES_FDA.md
"""
import os
import csv
import re

def classify_drug(name: str, usage: str) -> str:
    n = name.lower()
    u = usage.lower()
    if any(k in n for k in ['penicillin', 'amoxicillin', 'ampicillin', 'cloxacillin', 'methicillin', 'piperacillin', 'ticarcillin', 'nafcillin', 'oxacillin', 'dicloxacillin', 'flucloxacillin', 'temocillin', 'carbenicillin', 'mezlocillin', 'azlocillin', 'sulbenicillin', 'bacampicillin', 'pivampicillin', 'talampicillin', 'epicillin', 'hetacillin']):
        return "Beta-Lactams: Penicillins & Aminopenicillins"
    elif any(k in n for k in ['cef', 'ceph', 'moxalactam', 'latamoxef']):
        return "Beta-Lactams: Cephalosporins & Siderophores"
    elif any(k in n for k in ['penem']):
        return "Beta-Lactams: Carbapenems"
    elif any(k in n for k in ['aztreonam', 'tigemonam', 'carumonam']):
        return "Beta-Lactams: Monobactams"
    elif any(k in n for k in ['floxacin', 'oxacin', 'nalidixic', 'cinoxacin', 'pipemidic', 'flumequine']):
        return "Fluoroquinolones & Quinolones"
    elif any(k in n for k in ['cycline']):
        return "Tetracyclines & Glycylcyclines"
    elif any(k in n for k in ['amikacin', 'gentamicin', 'tobramycin', 'kanamycin', 'neomycin', 'streptomycin', 'paromomycin', 'plazomicin', 'spectinomycin', 'netilmicin', 'isepamicin', 'arbekacin', 'sisomicin', 'dibekacin', 'ribostamycin', 'framycetin']):
        return "Aminoglycosides & Aminocyclitols"
    elif any(k in n for k in ['vancomycin', 'teicoplanin', 'telavancin', 'dalbavancin', 'oritavancin', 'ramoplanin']):
        return "Glycopeptides & Lipoglycopeptides"
    elif any(k in n for k in ['polymyxin', 'colistin']):
        return "Polymyxins (Lipopeptides)"
    elif any(k in n for k in ['nidazole']):
        return "Nitroimidazoles"
    elif any(k in n for k in ['mycin', 'micin', 'thromycin', 'josamycin', 'oleandomycin', 'spiramycin', 'troleandomycin', 'tylosin', 'fidaxomicin', 'solithromycin', 'cethromycin']):
        if 'clindamycin' in n or 'lincomycin' in n or 'pirlimycin' in n:
            return "Lincosamides"
        return "Macrolides & Ketolides"
    elif any(k in n for k in ['zolid']):
        return "Oxazolidinones"
    elif 'daptomycin' in n:
        return "Cyclic Lipopeptides"
    elif 'nitrofurantoin' in n or 'fosfomycin' in n:
        return "Urinary Antiseptics & Cell Wall Inhibitors"
    elif 'chloramphenicol' in n:
        return "Amphenicols"
    elif 'fusidic' in n:
        return "Steroidal Antibacterials"
    elif 'mupirocin' in n:
        return "Isoleucyl-tRNA Synthetase Inhibitors"
    else:
        return "Specialized & Miscellaneous Antimicrobials"

def extract_safety_highlights(symptoms: str) -> str:
    """Extract serious safety warnings and boxed warnings from symptoms description."""
    s_lower = symptoms.lower()
    highlights = []
    
    if "anaphylaxis" in s_lower or "severe allergic" in s_lower or "hypersensitivity" in s_lower:
        highlights.append("High risk of severe IgE-mediated anaphylaxis / hypersensitivity reactions.")
    if "nephrotox" in s_lower or "kidney injury" in s_lower or "interstitial nephritis" in s_lower or "acute tubular necrosis" in s_lower:
        highlights.append("Nephrotoxicity / Acute Kidney Injury (AKI) risk requiring renal dosing/monitoring.")
    if "ototox" in s_lower or "hearing" in s_lower or "vestibular" in s_lower or "tinnitus" in s_lower:
        highlights.append("Ototoxicity risk (auditory cochlear damage or permanent vestibular ataxia).")
    if "tendon" in s_lower or "tendinitis" in s_lower:
        highlights.append("Boxed Warning: Tendinitis, Achilles tendon rupture, and peripheral neuropathy.")
    if "qt prolongation" in s_lower or "arrhythmia" in s_lower:
        highlights.append("Cardiac Warning: Corrected QT (QTc) prolongation and risk of Torsades de pointes.")
    if "hepatotox" in s_lower or "liver injury" in s_lower or "jaundice" in s_lower or "transaminase" in s_lower:
        highlights.append("Hepatotoxicity / cholestatic jaundice or elevated hepatic transaminases.")
    if "seizure" in s_lower or "neurotox" in s_lower or "encephalopathy" in s_lower or "convulsion" in s_lower:
        highlights.append("Neurotoxicity / central nervous system toxicity (lowers seizure threshold).")
    if "clostridioides difficile" in s_lower or "c. diff" in s_lower or "pseudomembranous" in s_lower:
        highlights.append("Superinfection risk: Clostridioides difficile-associated diarrhea (CDAD) / colitis.")
    if "tooth" in s_lower or "enamel" in s_lower:
        highlights.append("Pediatric Warning: Permanent tooth discoloration and enamel hypoplasia (<8 years).")
    if "bone marrow" in s_lower or "aplastic anemia" in s_lower or "neutropenia" in s_lower or "thrombocytopenia" in s_lower or "myelosuppression" in s_lower:
        highlights.append("Hematologic Warning: Myelosuppression, neutropenia, or potential aplastic anemia.")
    if "disulfiram" in s_lower or "nmtt" in s_lower:
        highlights.append("Ethanol Warning: Disulfiram-like adverse reaction with alcohol co-ingestion (NMTT side chain).")
    if "veterinary" in s_lower or "not approved or indicated for human" in s_lower:
        highlights.append("VETERINARY EXCLUSIVE: Strictly contraindicated and prohibited in human patients.")
    if "mortality" in s_lower:
        highlights.append("Boxed Warning: Increased all-cause mortality documented in clinical trial data.")
    if "rhabdomyolysis" in s_lower or "muscle injury" in s_lower:
        highlights.append("Musculoskeletal Warning: Rhabdomyolysis / skeletal muscle toxicity; monitor CPK.")
    
    if not highlights:
        highlights.append("Monitor for standard adverse drug events and secondary gastrointestinal disturbances.")
        
    return " ".join(f"- {h}" for h in highlights)

def main():
    src_csv = os.path.join(os.path.dirname(__file__), "..", "data", "seed", "antibiotic_usage_symptoms_fda.csv")
    out_md = os.path.join(os.path.dirname(__file__), "..", "app", "knowledge", "data_source", "ANTIBIOTIC_SAFETY_PROFILES_FDA.md")
    
    with open(src_csv, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        
    print(f"Loaded {len(reader)} antibiotic rows from CSV.")
    
    # Group by class
    groups = {}
    for r in reader:
        cls_name = classify_drug(r["antibiotic_name"], r["usage"])
        groups.setdefault(cls_name, []).append(r)
        
    md_lines = [
        "# FDA & WHO Authorized Antibiotic Safety Compendium (180 Antimicrobial Agents)",
        "",
        "Comprehensive clinical pharmacovigilance and prescribing reference indexed for AMR-Guard.",
        "Contains authorized clinical indications, common adverse symptom profiles, boxed warnings, and organ toxicity guardrails.",
        "",
        f"**Total Verified Antibiotics**: {len(reader)} drugs across {len(groups)} distinct antimicrobial classes.",
        "",
        "---",
        "",
    ]
    
    for cls_name in sorted(groups.keys()):
        items = groups[cls_name]
        md_lines.append(f"## Antimicrobial Class: {cls_name}")
        md_lines.append(f"*Total Agents in Class: {len(items)}*")
        md_lines.append("")
        
        for item in items:
            name = item["antibiotic_name"].strip()
            usage = item["usage"].strip()
            symptoms = item["symptoms"].strip()
            highlights = extract_safety_highlights(symptoms)
            
            md_lines.append(f"### Antimicrobial Agent: {name}")
            md_lines.append(f"* **Classification Group**: {cls_name}")
            md_lines.append(f"* **Authorized Clinical Indications & Spectrum**: {usage}")
            md_lines.append(f"* **Adverse Reactions & Symptom Profile**: {symptoms}")
            md_lines.append(f"* **Key Pharmacovigilance & Clinical Guardrails**:\n{highlights}")
            md_lines.append("")
            
        md_lines.append("---")
        md_lines.append("")
        
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
        
    size_kb = os.path.getsize(out_md) / 1024
    print(f"Successfully generated {out_md} ({size_kb:.1f} KB).")

if __name__ == "__main__":
    main()
