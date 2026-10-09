// [SOLID: SRP] Authoritative Clinical Knowledge Base for WHO AWaRe, CDSCO Banned FDCs, and ICMR STGs

export interface AwareDrugItem {
  id: string;
  genericName: string;
  category: "Access" | "Watch" | "Reserve" | "Discouraged";
  therapeuticClass: string;
  whoTarget: string;
  indications: string;
  cautions: string;
  // Extended Clinical Reference Details
  brandNames?: string[];
  atcCode?: string;
  routeOfAdministration?: string;
  mechanismOfAction?: string;
  standardDoseAdult?: string;
  standardDosePediatric?: string;
  renalDosingAdjustment?: string;
  pregnancySafety?: string;
  monitoringParameters?: string;
  relatedSyndromes?: string[];
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
  // Extended Details
  healthHazards?: string;
  regulatoryBody?: string;
  riskScorePenalty?: number;
  clinicalContext?: string;
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
  // Extended Details
  diagnosticCriteria?: string;
  investigationsRecommended?: string;
  secondLineTherapy?: string;
  clinicalSetting?: string;
}

export type GuidelineEntity =
  | { type: "aware"; data: AwareDrugItem }
  | { type: "icmr"; data: IcmrGuidelineItem }
  | { type: "fdc"; data: BannedFdcItem };

export function getGuidelineItemById(id: string): GuidelineEntity | null {
  const aware = WHO_AWARE_DRUGS.find((d) => d.id === id);
  if (aware) return { type: "aware", data: aware };

  const icmr = ICMR_OUTPATIENT_GUIDELINES.find((g) => g.id === id);
  if (icmr) return { type: "icmr", data: icmr };

  const fdc = CDSCO_BANNED_FDCS.find((f) => f.id === id);
  if (fdc) return { type: "fdc", data: fdc };

  return null;
}

export const WHO_AWARE_DRUGS: AwareDrugItem[] = [
  {
    id: "amoxicillin",
    genericName: "Amoxicillin",
    category: "Access",
    therapeuticClass: "Aminopenicillin",
    whoTarget: "First/Second line for primary care (>60% of all prescriptions)",
    indications: "Acute otitis media, community-acquired respiratory tract infections, pharyngitis, sinusitis, dental infections",
    cautions: "Confirm absence of penicillin hypersensitivity. Renal dosage adjustment in severe CKD.",
    brandNames: ["Mox", "Novamox", "Amoxil"],
    atcCode: "J01CA04",
    routeOfAdministration: "Oral (Capsules, Tablets, Oral Suspension)",
    mechanismOfAction: "Bactericidal aminopenicillin. Inhibits transpeptidase enzyme during bacterial cell wall peptidoglycan synthesis.",
    standardDoseAdult: "500 mg PO TDS (or 1000 mg PO TDS for high-dose respiratory regimens) x 5–7 days",
    standardDosePediatric: "40–45 mg/kg/day divided in 2–3 oral doses",
    renalDosingAdjustment: "eGFR > 30: No dose adjustment needed. eGFR 10–30: 500 mg q12h. eGFR < 10: 500 mg q24h.",
    pregnancySafety: "Category B (Safe throughout pregnancy and lactation).",
    monitoringParameters: "Hypersensitivity signs, skin rash, renal function in prolonged therapy.",
    relatedSyndromes: ["Acute Otitis Media", "Pharyngitis / Tonsillitis", "Community-Acquired Pneumonia", "Dental Abscess"],
  },
  {
    id: "amox-clav",
    genericName: "Amoxicillin + Clavulanic Acid",
    category: "Access",
    therapeuticClass: "Beta-lactam + Beta-lactamase inhibitor",
    whoTarget: "Second-line Access (Reserve for beta-lactamase producing organisms)",
    indications: "Bite wounds, refractory otitis media, moderate CAP with comorbidities, polymicrobial dental abscess",
    cautions: "Higher risk of gastrointestinal adverse events (diarrhea) and drug-induced hepatotoxicity.",
    brandNames: ["Augmentin", "Clavam", "Moxikind-CV"],
    atcCode: "J01CR02",
    routeOfAdministration: "Oral / IV",
    mechanismOfAction: "Amoxicillin provides bactericidal activity while Clavulanic acid irreversibly inhibits beta-lactamases produced by resistant pathogens.",
    standardDoseAdult: "625 mg (500/125 mg) PO TDS or 1000 mg (875/125 mg) PO BD x 5–7 days",
    standardDosePediatric: "30–45 mg/kg/day (amoxicillin component) in divided doses",
    renalDosingAdjustment: "Avoid 875/125 mg formulations if CrCl < 30 mL/min. Use 500/125 mg BD if CrCl 10–30 mL/min.",
    pregnancySafety: "Category B (Generally safe; avoid near delivery if risk of necrotizing enterocolitis).",
    monitoringParameters: "Hepatic function tests (cholestatic jaundice risk), GI tolerance.",
    relatedSyndromes: ["Bite Wounds", "Recurrent / Refractory Otitis Media", "Complicated Sinusitis"],
  },
  {
    id: "cefalexin",
    genericName: "Cefalexin (Cephalexin)",
    category: "Access",
    therapeuticClass: "1st Generation Cephalosporin",
    whoTarget: "First-line Access for skin & soft tissue",
    indications: "Uncomplicated cellulitis, impetigo, folliculitis, surgical prophylaxis in dental procedures",
    cautions: "Minimal activity against H. influenzae or anaerobes. Not suitable for deep systemic pneumonia.",
    brandNames: ["Sporidex", "Phexin", "Keflex"],
    atcCode: "J01DB01",
    routeOfAdministration: "Oral",
    mechanismOfAction: "First-generation oral cephalosporin; inhibits bacterial cell wall synthesis with high Gram-positive affinity.",
    standardDoseAdult: "500 mg PO QDS or TDS x 5–7 days",
    standardDosePediatric: "25–50 mg/kg/day divided q6–8h",
    renalDosingAdjustment: "CrCl < 50 mL/min: reduce dose frequency to q8–12h.",
    pregnancySafety: "Category B (Safe in pregnancy).",
    monitoringParameters: "Skin rashes, cross-reactivity in patients with severe IgE-mediated penicillin allergy.",
    relatedSyndromes: ["Cellulitis", "Impetigo", "Furunculosis"],
  },
  {
    id: "doxycycline",
    genericName: "Doxycycline",
    category: "Access",
    therapeuticClass: "Tetracycline",
    whoTarget: "Access Tier for atypicals & scrub typhus",
    indications: "Scrub typhus, rickettsial fever, atypical pneumonia, acne vulgaris, pelvic inflammatory disease",
    cautions: "CONTRAINDICATED in pregnancy and children < 8 years due to permanent dental discoloration.",
    brandNames: ["Doxicip", "Microdox", "Vibramycin"],
    atcCode: "J01AA02",
    routeOfAdministration: "Oral / IV",
    mechanismOfAction: "Bacteriostatic tetracycline; reversibly binds to the bacterial 30S ribosomal subunit inhibiting protein synthesis.",
    standardDoseAdult: "100 mg PO BD on day 1, followed by 100 mg OD or BD x 5–10 days",
    standardDosePediatric: "Contraindicated in children < 8 years.",
    renalDosingAdjustment: "No dosage adjustment needed (primarily excreted via gastrointestinal and biliary routes).",
    pregnancySafety: "Category D (Strictly contraindicated in pregnancy — permanent fetal tooth staining).",
    monitoringParameters: "Esophageal ulceration (take with full glass of water and remain upright for 30 minutes), photosensitivity.",
    relatedSyndromes: ["Scrub Typhus", "Atypical Respiratory Infections", "Pelvic Inflammatory Disease"],
  },
  {
    id: "gentamicin",
    genericName: "Gentamicin",
    category: "Access",
    therapeuticClass: "Aminoglycoside",
    whoTarget: "Access Tier (Hospital inpatient monitoring required)",
    indications: "Severe sepsis, neonatal sepsis with ampicillin, pyelonephritis (inpatient)",
    cautions: "High risk of irreversible ototoxicity and nephrotoxicity. Requires serum creatinine monitoring.",
    brandNames: ["Garamycin", "Genticyn"],
    atcCode: "J01GB03",
    routeOfAdministration: "IV / IM (Hospital Inpatient Only)",
    mechanismOfAction: "Bactericidal aminoglycoside; binds irreversibly to 30S ribosomal subunit disrupting bacterial translation.",
    standardDoseAdult: "5–7 mg/kg IV once daily (extended-interval dosing) with serum level monitoring",
    standardDosePediatric: "2.5 mg/kg IV q8h or 7.5 mg/kg IV once daily with therapeutic drug monitoring",
    renalDosingAdjustment: "Strict dose interval adjustment using Cockcroft-Gault nomogram; monitor peak and trough levels.",
    pregnancySafety: "Category D (Risk of congenital irreversible cranial nerve VIII toxicity).",
    monitoringParameters: "Serum creatinine and BUN daily, audiometry, trough levels (< 1 mcg/mL target).",
    relatedSyndromes: ["Severe Sepsis", "Neonatal Bacteremia", "Complicated Inpatient Pyelonephritis"],
  },
  {
    id: "nitrofurantoin",
    genericName: "Nitrofurantoin",
    category: "Access",
    therapeuticClass: "Nitrofuran",
    whoTarget: "First-line Access exclusively for lower UTI",
    indications: "Acute uncomplicated cystitis in females, catheter-associated lower urinary infection",
    cautions: "Ineffective for pyelonephritis or systemic infections (poor tissue penetration). Contraindicated if eGFR < 30.",
    brandNames: ["Macrobid", "Furadantin", "Martifur"],
    atcCode: "J01XE01",
    routeOfAdministration: "Oral (take with food to maximize absorption and reduce nausea)",
    mechanismOfAction: "Bacterial flavoproteins reduce drug to reactive electrophilic intermediates that damage bacterial ribosomal RNA and DNA.",
    standardDoseAdult: "100 mg PO BD (modified release / macrocrystals) x 5 days",
    standardDosePediatric: "5–7 mg/kg/day divided in 4 doses for children > 3 months",
    renalDosingAdjustment: "CONTRAINDICATED if eGFR < 30 mL/min (sub-therapeutic urinary concentration and increased systemic toxicity).",
    pregnancySafety: "Category B (Avoid at term 38–42 weeks due to risk of neonatal hemolytic anemia).",
    monitoringParameters: "Urine color (harmless brown discoloration), nausea, pulmonary toxicity in prolonged prophylaxis.",
    relatedSyndromes: ["Acute Uncomplicated Cystitis (Lower UTI)", "Recurrent UTI Prophylaxis"],
  },
  {
    id: "azithromycin",
    genericName: "Azithromycin",
    category: "Watch",
    therapeuticClass: "Macrolide / Azalide",
    whoTarget: "Prioritize for specific indications only (High resistance risk in India)",
    indications: "Atypical CAP (Mycoplasma/Chlamydia), culture-confirmed enteric fever, penicillin-allergic patients",
    cautions: "Overprescribed in outpatient viral illnesses. Increases risk of QTc prolongation and cardiotoxicity.",
    brandNames: ["Azithral", "Azee", "Zithromax"],
    atcCode: "J01FA10",
    routeOfAdministration: "Oral / IV",
    mechanismOfAction: "Macrolide azalide; binds to 50S ribosomal subunit preventing transpeptidation.",
    standardDoseAdult: "500 mg PO OD on day 1, followed by 250 mg OD on days 2–5 (or 500 mg OD x 3 days)",
    standardDosePediatric: "10 mg/kg/day PO OD x 3–5 days",
    renalDosingAdjustment: "No adjustment required in mild to moderate renal insufficiency (predominantly biliary excretion).",
    pregnancySafety: "Category B (Safe alternative when beta-lactams are contraindicated).",
    monitoringParameters: "Baseline ECG in patients with heart failure or bradycardia (QTc prolongation risk), GI cramping.",
    relatedSyndromes: ["Atypical Pneumonia", "Enteric Fever (Culture-guided)", "Chlamydia Urethritis"],
  },
  {
    id: "cefixime",
    genericName: "Cefixime",
    category: "Watch",
    therapeuticClass: "3rd Generation Oral Cephalosporin",
    whoTarget: "High risk of inducing ESBL resistance; strictly limit empirical use",
    indications: "Second-line for uncomplicated enteric fever (Salmonella), resistant gonococcal infection",
    cautions: "Inappropriate for viral bronchitis or common cold. Poor Gram-positive coverage compared to Amoxicillin.",
    brandNames: ["Taxim-O", "Zifi", "Cefspan"],
    atcCode: "J01DD08",
    routeOfAdministration: "Oral",
    mechanismOfAction: "Third-generation oral cephalosporin; inhibits bacterial cell wall synthesis with enhanced stability against Gram-negative beta-lactamases.",
    standardDoseAdult: "200 mg PO BD or 400 mg PO OD x 5–7 days",
    standardDosePediatric: "8 mg/kg/day divided into 1 or 2 oral doses",
    renalDosingAdjustment: "CrCl < 20 mL/min: reduce dose to 200 mg PO OD.",
    pregnancySafety: "Category B.",
    monitoringParameters: "Gastrointestinal disturbances, monitoring for Clostridioides difficile diarrhea.",
    relatedSyndromes: ["Uncomplicated Enteric Fever (Salmonella)", "Resistant Gonococcal Infection"],
  },
  {
    id: "ciprofloxacin",
    genericName: "Ciprofloxacin",
    category: "Watch",
    therapeuticClass: "Fluoroquinolone",
    whoTarget: "Highest priority critically important antimicrobial; avoid as first-line",
    indications: "Invasive bacillary dysentery (Shigella), complicated pyelonephritis with susceptibility",
    cautions: "FDA black box warning: Tendon rupture, peripheral neuropathy, aortic aneurysm. Contraindicated in pediatrics.",
    brandNames: ["Ciplox", "Cifran", "Cipro"],
    atcCode: "J01MA02",
    routeOfAdministration: "Oral / IV",
    mechanismOfAction: "Fluoroquinolone; bactericidal inhibition of topoisomerase II (DNA gyrase) and topoisomerase IV.",
    standardDoseAdult: "500 mg PO BD x 5–7 days (restricted to documented susceptible pathogens)",
    standardDosePediatric: "Generally contraindicated in pediatric patients due to cartilage erosion in weight-bearing joints.",
    renalDosingAdjustment: "CrCl 30–50: 250–500 mg q12h. CrCl < 30: 250–500 mg q18h.",
    pregnancySafety: "Category C (Avoid; risk of cartilage damage).",
    monitoringParameters: "Tendon pain / swelling (immediate discontinuation required), peripheral neuropathy, central nervous system stimulation.",
    relatedSyndromes: ["Invasive Bacillary Dysentery (Shigella)", "Complicated Pyelonephritis (Culture-proven)"],
  },
  {
    id: "levofloxacin",
    genericName: "Levofloxacin",
    category: "Watch",
    therapeuticClass: "Respiratory Fluoroquinolone",
    whoTarget: "Restricted Watch (Preserve for MDR-TB and documented resistant pneumonia)",
    indications: "Hospital-acquired pneumonia, MDR tuberculosis regimen component, severe prostatitis",
    cautions: "Contraindicated in children < 18 and pregnant women. Accelerates MRSA and Pseudomonas resistance.",
    brandNames: ["Levomac", "Levaquin", "Glevo"],
    atcCode: "J01MA12",
    routeOfAdministration: "Oral / IV",
    mechanismOfAction: "Optically active L-isomer of ofloxacin; inhibits bacterial DNA gyrase and topoisomerase IV.",
    standardDoseAdult: "500 mg PO OD (or 750 mg OD for severe respiratory infections) x 5–10 days",
    standardDosePediatric: "Contraindicated in children < 18 years.",
    renalDosingAdjustment: "CrCl 20–49 mL/min: 500 mg initial, then 250 mg q24h. CrCl 10–19: 500 mg initial, then 250 mg q48h.",
    pregnancySafety: "Category C.",
    monitoringParameters: "QTc interval on ECG, blood glucose fluctuations in diabetic patients, tendonitis.",
    relatedSyndromes: ["MDR-Tuberculosis Regimens", "Severe Inpatient Prostatitis", "Complicated Pneumonia"],
  },
  {
    id: "meropenem",
    genericName: "Meropenem",
    category: "Watch",
    therapeuticClass: "Carbapenem",
    whoTarget: "Critical Watch / Restricted Inpatient Only",
    indications: "Documented ESBL bacteremia, intra-abdominal sepsis, febrile neutropenia, meningitis",
    cautions: "Requires infectious disease stewardship approval. Indiscriminate use breeds Carbapenem-Resistant Enterobacteriaceae (CRE).",
    brandNames: ["Meronem", "Meromac"],
    atcCode: "J01DH02",
    routeOfAdministration: "IV (Hospital Inpatient Only)",
    mechanismOfAction: "Ultra-broad-spectrum carbapenem; binds to penicillin-binding proteins with high stability against bacterial beta-lactamases.",
    standardDoseAdult: "1 g IV q8h (2 g IV q8h for central nervous system infections / meningitis)",
    standardDosePediatric: "10–20 mg/kg IV q8h (40 mg/kg q8h for meningitis)",
    renalDosingAdjustment: "CrCl 26–50: 1g q12h. CrCl 10–25: 500 mg q12h. CrCl < 10: 500 mg q24h.",
    pregnancySafety: "Category B.",
    monitoringParameters: "Seizure activity in neurological patients, platelet counts, liver function.",
    relatedSyndromes: ["Documented ESBL Sepsis", "Febrile Neutropenia", "Bacterial Meningitis"],
  },
  {
    id: "colistin",
    genericName: "Colistin (Polymyxin E)",
    category: "Reserve",
    therapeuticClass: "Polymyxin",
    whoTarget: "Last-resort Reserve; never use empirically or out of hospital",
    indications: "Extensively drug-resistant (XDR) Acinetobacter baumannii, Klebsiella pneumoniae (CRE)",
    cautions: "High nephrotoxicity and neurotoxicity. Reserve strictly when all standard options have failed.",
    brandNames: ["Coly-Mycin", "Xylistin"],
    atcCode: "J01XB01",
    routeOfAdministration: "IV / Inhalation (Strict Last-Resort Hospital Reserve)",
    mechanismOfAction: "Cationic detergent polymyxin; interacts with bacterial lipopolysaccharide (LPS), disrupting outer membrane permeability.",
    standardDoseAdult: "Loading dose 9 million IU IV, followed by maintenance 4.5 million IU IV q12h",
    standardDosePediatric: "75,000–150,000 IU/kg/day IV divided into 3 doses",
    renalDosingAdjustment: "Extensive dosage adjustment per renal clearance nomogram; therapeutic drug monitoring mandatory.",
    pregnancySafety: "Category C (Neurotoxic and nephrotoxic risks).",
    monitoringParameters: "Serum creatinine and urine output hourly, neuromuscular blockade signs (paresthesias, respiratory depression).",
    relatedSyndromes: ["Extensively Drug-Resistant (XDR) Acinetobacter", "Carbapenem-Resistant Enterobacteriaceae (CRE)"],
  },
  {
    id: "linezolid",
    genericName: "Linezolid",
    category: "Reserve",
    therapeuticClass: "Oxazolidinone",
    whoTarget: "Restricted Reserve for Gram-positive MDR organisms",
    indications: "Documented MRSA pneumonia/bacteremia, Vancomycin-Resistant Enterococcus (VRE)",
    cautions: "Myelosuppression (thrombocytopenia) with courses > 14 days. Risk of serotonin syndrome with SSRIs.",
    brandNames: ["Lizolid", "Zyvox", "Linospan"],
    atcCode: "J01XX08",
    routeOfAdministration: "Oral / IV (100% oral bioavailability)",
    mechanismOfAction: "Synthetic oxazolidinone; binds to 23S ribosomal RNA of the 50S subunit, preventing assembly of functional 70S initiation complex.",
    standardDoseAdult: "600 mg PO or IV BD x 10–14 days",
    standardDosePediatric: "10 mg/kg PO or IV q8h for children < 12 years",
    renalDosingAdjustment: "No dose adjustment required in renal failure (two inactive primary metabolites excreted renally).",
    pregnancySafety: "Category C.",
    monitoringParameters: "Weekly complete blood count (thrombocytopenia / anemia if > 14 days), visual acuity if > 28 days.",
    relatedSyndromes: ["Documented MRSA Pneumonia", "Vancomycin-Resistant Enterococcus (VRE)"],
  },
  {
    id: "cefixime-azithro",
    genericName: "Cefixime + Azithromycin FDC",
    category: "Discouraged",
    therapeuticClass: "Irrational Dual-Antimicrobial FDC",
    whoTarget: "Completely discouraged by WHO & banned in India by CDSCO",
    indications: "NO acceptable clinical indication",
    cautions: "Banned under Indian Drugs and Cosmetics Act. Promotes rapid concurrent Cephalosporin and Macrolide co-resistance.",
    brandNames: ["Banned Formulations"],
    atcCode: "Irrational Combination",
    routeOfAdministration: "Prohibited for prescription",
    mechanismOfAction: "Dual antimicrobial assault without proven in-vivo synergy. Causes severe gut dysbiosis.",
    standardDoseAdult: "Contraindicated / Banned by CDSCO",
    standardDosePediatric: "Contraindicated / Banned by CDSCO",
    renalDosingAdjustment: "Not Applicable",
    pregnancySafety: "Contraindicated",
    monitoringParameters: "Immediate pharmacy block and stewardship intervention.",
    relatedSyndromes: ["No Legitimate Clinical Indication"],
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
    healthHazards: "Accelerates concurrent cephalosporin and macrolide resistance, high incidence of C. difficile colitis and microbiome disruption.",
    regulatoryBody: "Central Drugs Standard Control Organisation (CDSCO), MoHFW",
    riskScorePenalty: 100,
    clinicalContext: "Frequently prescribed empirically for common viral colds and fever; completely clinically unwarranted.",
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
    healthHazards: "Quinolone tendonopathy risk, severe gut dysbiosis, rapid rise of fluoroquinolone resistance in enteric pathogens.",
    regulatoryBody: "DCGI & Drugs Technical Advisory Board (DTAB)",
    riskScorePenalty: 100,
    clinicalContext: "Empiric diarrheal prescribing in primary care outpatient clinics.",
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
    healthHazards: "Promotes widespread multidrug resistance in uropathogens; unnecessary nitroimidazole exposure.",
    regulatoryBody: "CDSCO Statutory Directive",
    riskScorePenalty: 100,
    clinicalContext: "Commonly misprescribed for urinary tract infections and gastroenteritis.",
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
    healthHazards: "Accelerates quinolone-resistant Salmonella enterica and Shigella strains nationwide.",
    regulatoryBody: "Ministry of Health & Family Welfare",
    riskScorePenalty: 100,
    clinicalContext: "Empirical prescription for food poisoning and acute gastroenteritis.",
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
    healthHazards: "Depletes healthy protective commensals; breeds extended-spectrum beta-lactamase (ESBL) pathogens.",
    regulatoryBody: "DCGI Enforcement Division",
    riskScorePenalty: 100,
    clinicalContext: "Prescribed heavily by general practitioners for acute upper respiratory tract infections.",
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
    diagnosticCriteria: "Acute cough lasting up to 3 weeks without clinical evidence of pneumonia or chronic COPD exacerbation.",
    investigationsRecommended: "Chest X-ray only if vitals abnormal (respiratory rate > 24/min, heart rate > 100/min, temperature > 38°C).",
    secondLineTherapy: "If Bordetella pertussis confirmed by PCR: Azithromycin 500 mg OD on Day 1, then 250 mg OD x 4 days.",
    clinicalSetting: "Outpatient General Medicine / Family Medicine",
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
    diagnosticCriteria: "Rapid onset of ear pain, irritability in infants, with otoscopic bulging of tympanic membrane.",
    investigationsRecommended: "Pneumatic otoscopy. Routine blood investigations not needed in stable outpatient.",
    secondLineTherapy: "Amoxicillin-Clavulanate (90 mg/kg/day of amoxicillin component) if prior beta-lactam in last 30 days or treatment failure at 48h.",
    clinicalSetting: "Pediatric OPD / Primary Care Clinic",
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
    diagnosticCriteria: "Throbbing localized tooth pain, tenderness to percussion, localized buccal sulcus swelling.",
    investigationsRecommended: "Periapical and panoramic dental radiograph (OPG).",
    secondLineTherapy: "Metronidazole 400 mg TDS add-on if severe deep spreading fascial space involvement.",
    clinicalSetting: "Dental Surgery / Maxillofacial OPD",
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
    diagnosticCriteria: "Dysuria, urinary frequency, urgency, suprapubic pain without flank tenderness, fever, or vaginal discharge.",
    investigationsRecommended: "Urine routine/microscopy (pyuria >= 10 WBC/hpf, positive nitrites). Culture if recurrent or treatment failure.",
    secondLineTherapy: "Cefpodoxime proxetil 100 mg BD x 5 days or Amoxicillin-Clavulanic acid 625 mg BD x 5 days.",
    clinicalSetting: "General OPD / Gynecology / Urology Clinic",
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
    diagnosticCriteria: "Fever, cough, sputum production, pleuritic chest pain, tachypnea, focal crepitations confirmed by chest infiltrate.",
    investigationsRecommended: "Chest radiograph (PA view), baseline CBC, pulse oximetry (SpO2).",
    secondLineTherapy: "Cefuroxime axetil 500 mg PO BD + Azithromycin 500 mg PO OD x 5 days for penicillin-allergic patients.",
    clinicalSetting: "Pulmonary Medicine / General Medical OPD",
  },
];
