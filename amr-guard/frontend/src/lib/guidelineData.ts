// [SOLID: SRP] Authoritative Clinical Knowledge Base for WHO AWaRe, CDSCO Banned FDCs, and ICMR STGs
export interface AwareDrugItem {
  id: string;
  genericName: string;
  category: "Access" | "Watch" | "Reserve" | "Discouraged";
  therapeuticClass: string;
  whoTarget: string;
  indications: string;
  cautions: string;
}

export interface BannedFdcItem {
  id: string;
  combination: string;
  drugs: string[];
  gazetteNumber: string;
  effectiveDate: string;
  clinicalRationale: string;
  statutoryWarning: string;
  sanctionedAlternative: string;
}

export interface IcmrGuidelineItem {
  id: string;
  syndrome: string;
  code: string;
  targetPathogens: string;
  firstLineTherapy: string;
  firstLineDose: string;
  durationDays: string;
  pediatricGuidance: string;
  redFlagsAndContraindications: string;
  icmrReference: string;
}

export const WHO_AWARE_DRUGS: AwareDrugItem[] = [
  {
    id: "amoxicillin",
    genericName: "Amoxicillin",
    category: "Access",
    therapeuticClass: "Aminopenicillin",
    whoTarget: "First/Second line for primary care (>60% of all prescriptions)",
    indications: "Acute otitis media, community-acquired respiratory tract infections, pharyngitis, sinusitis",
    cautions: "Confirm absence of penicillin hypersensitivity. Renal dosage adjustment in severe CKD.",
  },
  {
    id: "amox-clav",
    genericName: "Amoxicillin + Clavulanic Acid",
    category: "Access",
    therapeuticClass: "Beta-lactam + Beta-lactamase inhibitor",
    whoTarget: "Second-line Access (Reserve for beta-lactamase producing organisms)",
    indications: "Bite wounds, refractory otitis media, moderate CAP with comorbidities, polymicrobial dental abscess",
    cautions: "Higher risk of gastrointestinal adverse events (diarrhea) and drug-induced hepatotoxicity.",
  },
  {
    id: "cefalexin",
    genericName: "Cefalexin (Cephalexin)",
    category: "Access",
    therapeuticClass: "1st Generation Cephalosporin",
    whoTarget: "First-line Access for skin & soft tissue",
    indications: "Uncomplicated cellulitis, impetigo, folliculitis, surgical prophylaxis in dental procedures",
    cautions: "Minimal activity against H. influenzae or anaerobes. Not suitable for deep systemic pneumonia.",
  },
  {
    id: "doxycycline",
    genericName: "Doxycycline",
    category: "Access",
    therapeuticClass: "Tetracycline",
    whoTarget: "Access Tier for atypicals & scrub typhus",
    indications: "Scrub typhus, rickettsial fever, atypical pneumonia, acne vulgaris, pelvic inflammatory disease",
    cautions: "CONTRAINDICATED in pregnancy and children < 8 years due to permanent dental discoloration.",
  },
  {
    id: "gentamicin",
    genericName: "Gentamicin",
    category: "Access",
    therapeuticClass: "Aminoglycoside",
    whoTarget: "Access Tier (Hospital inpatient monitoring required)",
    indications: "Severe sepsis, neonatal sepsis with ampicillin, pyelonephritis (inpatient)",
    cautions: "High risk of irreversible ototoxicity and nephrotoxicity. Requires serum creatinine monitoring.",
  },
  {
    id: "nitrofurantoin",
    genericName: "Nitrofurantoin",
    category: "Access",
    therapeuticClass: "Nitrofuran",
    whoTarget: "First-line Access exclusively for lower UTI",
    indications: "Acute uncomplicated cystitis in females, catheter-associated lower urinary infection",
    cautions: "Ineffective for pyelonephritis or systemic infections (poor tissue penetration). Contraindicated if eGFR < 30.",
  },
  {
    id: "azithromycin",
    genericName: "Azithromycin",
    category: "Watch",
    therapeuticClass: "Macrolide / Azalide",
    whoTarget: "Prioritize for specific indications only (High resistance risk in India)",
    indications: "Atypical CAP (Mycoplasma/Chlamydia), culture-confirmed enteric fever, penicillin-allergic patients",
    cautions: "Overprescribed in outpatient viral illnesses. Increases risk of QTc prolongation and cardiotoxicity.",
  },
  {
    id: "cefixime",
    genericName: "Cefixime",
    category: "Watch",
    therapeuticClass: "3rd Generation Oral Cephalosporin",
    whoTarget: "High risk of inducing ESBL resistance; strictly limit empirical use",
    indications: "Second-line for uncomplicated enteric fever (Salmonella), resistant gonococcal infection",
    cautions: "Inappropriate for viral bronchitis or common cold. Poor Gram-positive coverage compared to Amoxicillin.",
  },
  {
    id: "ciprofloxacin",
    genericName: "Ciprofloxacin",
    category: "Watch",
    therapeuticClass: "Fluoroquinolone",
    whoTarget: "Highest priority critically important antimicrobial; avoid as first-line",
    indications: "Invasive bacillary dysentery (Shigella), complicated pyelonephritis with susceptibility",
    cautions: "FDA black box warning: Tendon rupture, peripheral neuropathy, aortic aneurysm. Contraindicated in pediatrics.",
  },
  {
    id: "levofloxacin",
    genericName: "Levofloxacin",
    category: "Watch",
    therapeuticClass: "Respiratory Fluoroquinolone",
    whoTarget: "Restricted Watch (Preserve for MDR-TB and documented resistant pneumonia)",
    indications: "Hospital-acquired pneumonia, MDR tuberculosis regimen component, severe prostatitis",
    cautions: "Contraindicated in children < 18 and pregnant women. Accelerates MRSA and Pseudomonas resistance.",
  },
  {
    id: "meropenem",
    genericName: "Meropenem",
    category: "Watch",
    therapeuticClass: "Carbapenem",
    whoTarget: "Critical Watch / Restricted Inpatient Only",
    indications: "Documented ESBL bacteremia, intra-abdominal sepsis, febrile neutropenia, meningitis",
    cautions: "Requires infectious disease stewardship approval. Indiscriminate use breeds Carbapenem-Resistant Enterobacteriaceae (CRE).",
  },
  {
    id: "colistin",
    genericName: "Colistin (Polymyxin E)",
    category: "Reserve",
    therapeuticClass: "Polymyxin",
    whoTarget: "Last-resort Reserve; never use empirically or out of hospital",
    indications: "Extensively drug-resistant (XDR) Acinetobacter baumannii, Klebsiella pneumoniae (CRE)",
    cautions: "High nephrotoxicity and neurotoxicity. Reserve strictly when all standard options have failed.",
  },
  {
    id: "linezolid",
    genericName: "Linezolid",
    category: "Reserve",
    therapeuticClass: "Oxazolidinone",
    whoTarget: "Restricted Reserve for Gram-positive MDR organisms",
    indications: "Documented MRSA pneumonia/bacteremia, Vancomycin-Resistant Enterococcus (VRE)",
    cautions: "Myelosuppression (thrombocytopenia) with courses > 14 days. Risk of serotonin syndrome with SSRIs.",
  },
  {
    id: "cefixime-azithro",
    genericName: "Cefixime + Azithromycin FDC",
    category: "Discouraged",
    therapeuticClass: "Irrational Dual-Antimicrobial FDC",
    whoTarget: "Completely discouraged by WHO & banned in India by CDSCO",
    indications: "NO acceptable clinical indication",
    cautions: "Banned under Indian Drugs and Cosmetics Act. Promotes rapid concurrent Cephalosporin and Macrolide co-resistance.",
  },
];

export const CDSCO_BANNED_FDCS: BannedFdcItem[] = [
  {
    id: "fdc-cefixime-azithro",
    combination: "Cefixime + Azithromycin",
    drugs: ["Cefixime", "Azithromycin"],
    gazetteNumber: "S.O. 4464(E) / MoHFW Notification",
    effectiveDate: "Gazette Notification Sept 2018 & Dec 2023",
    clinicalRationale:
      "Irrational combination of a 3rd-generation oral cephalosporin with an azalide macrolide. Exposes gut microbiome to massive broad-spectrum selection pressure without additive synergistic bactericidal efficacy in outpatient infections.",
    statutoryWarning:
      "Prohibited for manufacturing, sale, and clinical distribution under Section 26A of Drugs and Cosmetics Act, 1940.",
    sanctionedAlternative:
      "Prescribe single-agent Amoxicillin (500 mg TDS) for bacterial respiratory infections, or oral Cefixime (200 mg BD alone) if culture indicates.",
  },
  {
    id: "fdc-oflox-ornidazole",
    combination: "Ofloxacin + Ornidazole",
    drugs: ["Ofloxacin", "Ornidazole"],
    gazetteNumber: "S.O. 3971(E) / Drug Controller General of India",
    effectiveDate: "Gazette Notification Aug 2023",
    clinicalRationale:
      "Routinely and irrationally prescribed for acute watery diarrhea. Most acute diarrhea cases are viral (Rotavirus/Norovirus) or non-invasive where antimicrobials are contraindicated. Drives fluoroquinolone resistance in commensal E. coli.",
    statutoryWarning:
      "Irrational Fixed-Dose Combination prohibited for outpatient routine prescribing without microscopic evidence of mixed bacterial/protozoal colitis.",
    sanctionedAlternative:
      "Oral Rehydration Salts (ORS) + Zinc (20 mg/day x 14 days) is the standard of care. If invasive dysentery is confirmed, use Ciprofloxacin (single agent) or Azithromycin alone.",
  },
  {
    id: "fdc-norflox-tinidazole",
    combination: "Norfloxacin + Tinidazole",
    drugs: ["Norfloxacin", "Tinidazole"],
    gazetteNumber: "S.O. 4467(E) / CDSCO Expert Committee",
    effectiveDate: "Gazette Notification Sept 2018",
    clinicalRationale:
      "Combines an obsolete quinolone with high systemic resistance with a nitroimidazole. Lacks pharmacokinetic rationale and exacerbates tendonopathy risks while fueling plasmid-mediated quinolone resistance (PMQR).",
    statutoryWarning:
      "Banned combination under statutory review of DTAB (Drugs Technical Advisory Board).",
    sanctionedAlternative:
      "For lower urinary tract infections: Nitrofurantoin 100 mg BD x 5 days or Fosfomycin 3g single dose. Do NOT use quinolone/nitroimidazole FDCs.",
  },
  {
    id: "fdc-cipro-tinidazole",
    combination: "Ciprofloxacin + Tinidazole",
    drugs: ["Ciprofloxacin", "Tinidazole"],
    gazetteNumber: "S.O. 4468(E) / MoHFW Statutory Order",
    effectiveDate: "Gazette Notification Sept 2018",
    clinicalRationale:
      "Irrational empiric therapy for gastroenteritis. Causes collateral damage to anaerobic intestinal microbiota while providing zero clinical benefit over oral rehydration in uncomplicated diarrhea.",
    statutoryWarning:
      "Classified as irrational and banned under Section 26A.",
    sanctionedAlternative:
      "Targeted unbundled single-agent antimicrobials guided by stool culture and sensitivity.",
  },
  {
    id: "fdc-cefpodoxime-azithro",
    combination: "Cefpodoxime Proxetil + Azithromycin",
    drugs: ["Cefpodoxime", "Azithromycin"],
    gazetteNumber: "S.O. 3291(E) / DCGI Directive",
    effectiveDate: "Gazette Notification 2023",
    clinicalRationale:
      "Excessive broad-spectrum combination for mild pediatric/adult respiratory infections. Violates basic antimicrobial stewardship principles by dispensing Watch-category agents simultaneously.",
    statutoryWarning:
      "Marketing authorization withdrawn for irrational fixed-ratio formulations.",
    sanctionedAlternative:
      "Amoxicillin 500 mg TDS x 5 days for adult acute bacterial sinusitis; Amoxicillin 40 mg/kg/day in children.",
  },
];

export const ICMR_OUTPATIENT_GUIDELINES: IcmrGuidelineItem[] = [
  {
    id: "icmr-acute-bronchitis",
    syndrome: "Acute Bronchitis (Adult OPD)",
    code: "ICMR-RESP-01",
    targetPathogens: "90–95% Viral (Influenza, Rhinovirus, Adenovirus, Coronavirus)",
    firstLineTherapy: "No Antimicrobial Indicated (Symptomatic Supportive Care Only)",
    firstLineDose: "Paracetamol 650 mg SOS + Steam inhalation + Cough lozenges",
    durationDays: "0 days (Antibiotics strictly discouraged)",
    pediatricGuidance: "Antibiotics contraindicated in healthy pediatric bronchitis without pneumonia signs.",
    redFlagsAndContraindications:
      "Never prescribe Cefixime, Azithromycin, or Amoxicillin empirically for purulent sputum in acute bronchitis without tachypnea or focal chest consolidation.",
    icmrReference: "ICMR STG 2022: Common Respiratory Infections, Section 3.2, p. 24",
  },
  {
    id: "icmr-pediatric-febrile",
    syndrome: "Acute Febrile Illness / Otitis Media (Pediatrics)",
    code: "ICMR-PED-04",
    targetPathogens: "Streptococcus pneumoniae, Haemophilus influenzae, Moraxella catarrhalis",
    firstLineTherapy: "Amoxicillin (High Dose)",
    firstLineDose: "40–45 mg/kg/day in 2 or 3 divided oral doses",
    durationDays: "5–7 days",
    pediatricGuidance: "Ensure weight-based dosing. Fluoroquinolones and Tetracyclines are STRICTLY CONTRAINDICATED.",
    redFlagsAndContraindications:
      "Do NOT use Cefixime or Azithromycin as first-line in uncomplicated pediatric otitis media unless documented Type-1 penicillin allergy.",
    icmrReference: "ICMR Treatment Guidelines for Antimicrobial Use in Pediatrics 2023, p. 18",
  },
  {
    id: "icmr-dental-abscess",
    syndrome: "Acute Dentoalveolar Abscess / Odontogenic Infection",
    code: "ICMR-DENT-02",
    targetPathogens: "Polymicrobial oral flora (Viridans streptococci, Peptostreptococcus, Prevotella)",
    firstLineTherapy: "Amoxicillin OR (if penicillin-allergic) Clindamycin",
    firstLineDose: "Amoxicillin 500 mg PO TDS OR Clindamycin 300 mg PO TDS",
    durationDays: "5 days (concurrent with dental drainage/debridement)",
    pediatricGuidance: "Pediatric dosing: Amoxicillin 30–40 mg/kg/day or Clindamycin 10–20 mg/kg/day in 3 doses.",
    redFlagsAndContraindications:
      "Penicillin Allergy Check Mandatory. Do not use macrolides (Erythromycin/Azithromycin) due to high streptococcal resistance (>40% in India).",
    icmrReference: "ICMR STG: Odontogenic Infections & Oral Stewardship 2022, p. 45",
  },
  {
    id: "icmr-uncomplicated-uti",
    syndrome: "Acute Uncomplicated Cystitis (Lower UTI)",
    code: "ICMR-URO-01",
    targetPathogens: "Uropathogenic Escherichia coli (UPEC), Klebsiella pneumoniae, Staphylococcus saprophyticus",
    firstLineTherapy: "Nitrofurantoin (Macrobid) OR Fosfomycin Trometamol",
    firstLineDose: "Nitrofurantoin 100 mg BD x 5 days OR Fosfomycin 3g PO single sachet",
    durationDays: "5 days (Nitrofurantoin) or 1 day (Fosfomycin)",
    pediatricGuidance: "Nitrofurantoin 5–7 mg/kg/day in 4 divided doses for children > 3 months.",
    redFlagsAndContraindications:
      "Do NOT use Ciprofloxacin, Norfloxacin, or Ofloxacin as first-line due to >65% E. coli fluoroquinolone resistance in India (NARS-Net 2023).",
    icmrReference: "ICMR STG: Urological Infections & Stewardship Benchmarks 2022, p. 61",
  },
  {
    id: "icmr-community-pneumonia",
    syndrome: "Community-Acquired Pneumonia (CAP - Outpatient)",
    code: "ICMR-PNEU-03",
    targetPathogens: "Streptococcus pneumoniae, Mycoplasma pneumoniae, Chlamydia pneumoniae",
    firstLineTherapy: "Amoxicillin (High Dose) +/- Azithromycin if atypical suspected",
    firstLineDose: "Amoxicillin 1000 mg PO TDS (or 500 mg TDS in low-risk) x 5 days",
    durationDays: "5 days",
    pediatricGuidance: "Children 3 months - 5 years: Oral Amoxicillin 40 mg/kg/day in 2 divided doses.",
    redFlagsAndContraindications:
      "Assess CURB-65 score. Patients with confusion, respiratory rate >= 30, or hypotension require urgent hospital admission for parenteral therapy.",
    icmrReference: "ICMR STG: Adult Respiratory Medicine & Pulmonary Infections 2023, p. 33",
  },
];
