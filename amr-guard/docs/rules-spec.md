# Five-Tier Verification Pipeline Specification

This document defines the deterministic rules and mathematical scoring pipeline for AMR-Guard, derived directly from the **ICMR Standard Treatment Guidelines (STG)**, the **WHO AWaRe Classification Framework (2023)**, and the **ICMR-AMRSN Annual Antimicrobial Resistance Surveillance Reports**.

---

## 1. Architectural Philosophy: "Stochastic Edge, Deterministic Core"

Clinical safety cannot tolerate LLM hallucinations or probabilistic scoring drift. In AMR-Guard:
- **Stochastic Edge (LLMs / Multimodal Agent):** Parses raw unstructured text, images, or EHR notes into a strictly validated `ContextBundle` schema.
- **Deterministic Core (`app/engine/`):** Pure-Python deterministic verification pipeline that evaluates hard contraindications, indication criteria, AWaRe tiers, duration limits, and pathogen resistance benchmarking without calling any LLM.

---

## 2. Five-Tier Verification Pipeline

Each tier operates as a binary or bounded mathematical gate:

### Tier 1: Patient Safety & Hard Contraindication Rules (Zero Tolerance)
*Triggers an immediate **BLOCKED** status ($AMR\_Risk\_Score = 100.0$). No stewardship override permitted.*

1. **Rule 1.1: Pediatric Fluoroquinolone / Tetracycline Ban**
   - **Condition:** `patient_age < 18` AND drug belongs to:
     - Fluoroquinolones: `[Ciprofloxacin, Levofloxacin, Ofloxacin, Norfloxacin, Moxifloxacin]`
     - Tetracyclines: `[Doxycycline, Tetracycline, Minocycline]`
   - **Severity:** `BLOCKED` (Hard contraindication)
   - **Clinical Rationale:** Risk of irreversible musculoskeletal and articular cartilage damage (arthropathy) from fluoroquinolones, and permanent pediatric dental enamel discoloration/hypoplasia and bone growth inhibition from tetracyclines.
   - **Citation:** ICMR STG Pediatric Guidelines & FDA Black Box Warning.

2. **Rule 1.2: Pregnancy Safety Gate**
   - **Condition:** `is_pregnant == True` AND drug in FDA Category D/X or unapproved antimicrobials:
     - `[Doxycycline, Ciprofloxacin, Levofloxacin, Aminoglycosides (Amikacin, Gentamicin, Tobramycin), Clarithromycin]`
   - **Severity:** `BLOCKED` (Hard contraindication)
   - **Clinical Rationale:** High risk of fetal chondrotoxicity, congenital cartilage damage, vestibular and cochlear ototoxicity, and teratogenic effects.
   - **Citation:** US FDA Pregnancy Categories & WHO Clinical Guidance.

3. **Rule 1.3: Renal Clearance / Age Restriction for Nitrofurantoin**
   - **Condition:** Drug is `Nitrofurantoin` AND (`patient_age >= 65` OR documented low `eGFR < 30 mL/min`).
   - **Severity:** `BLOCKED` (Hard contraindication)
   - **Clinical Rationale:** Reduced glomerular filtration leads to inadequate urinary drug concentrations (therapeutic failure) and accumulation of toxic metabolites causing peripheral neuropathy and fatal pulmonary toxicity.
   - **Citation:** Beers Criteria for Potentially Inappropriate Medication Use in Older Adults & ICMR Guidelines.

---

### Tier 2: Indication & Diagnosis Legitimacy Rules
*Verifies whether an antimicrobial is medically indicated for the diagnosed syndrome.*

1. **Rule 2.1: Viral / Self-Limiting Infection Gate**
   - **Condition:** `canonical_syndrome` is one of:
     - `Acute Bronchitis` (`SYN_ACUTE_BRONCHITIS`)
     - `Common Cold` (`SYN_COMMON_COLD`)
     - `Viral URTI` (`SYN_VIRAL_URTI`)
     - `Pharyngitis without Strep criteria` (`SYN_PHARYNGITIS_NON_STREP`)
     - `Acute Watery Diarrhea` (`SYN_WATERY_DIARRHEA`)
   - **Rule:** `antibiotic_indicated == False`
   - **Action:** Flag violation. Apply Indication Penalty:
     $$P_{\text{indication}} = 100$$
   - **Remediation:** Mandate symptomatic supportive therapy only (e.g., ORS + Zinc for watery diarrhea; Paracetamol, saline gargles, and steam inhalation for viral URTI).
   - **Citation:** ICMR Guidelines for Common Outpatient Infections & WHO Essential Medicines List.

2. **Rule 2.2: Unapproved Fixed-Dose Combination (FDC) Rule**
   - **Condition:** Prescribed drug is an irrational dual-antibiotic or irrational antibacterial-antiprotozoal FDC (e.g., `Ofloxacin + Ornidazole`, `Cefixime + Azithromycin`, `Ciprofloxacin + Tinidazole`, `Norfloxacin + Tinidazole`).
   - **Action:** Immediate flag for irrational therapy; tag as *"Not Recommended"*.
   - **Remediation:** Discontinue irrational fixed-dose combination; recommend single-agent narrow-spectrum alternative tailored to suspected pathogen.
   - **Citation:** CDSCO Banned FDCs Gazette & ICMR AMR Action Plan.

---

### Tier 3: WHO AWaRe Spectrum & Tier Escalation Rules
*Enforces the WHO target that $\ge 60\%$ of total antibiotic consumption originate from the "Access" group.*

1. **Rule 3.1: Watch-Group Over-Escalation Check**
   - **Condition:** `drug.aware_tier == 'Watch'` (e.g., Azithromycin, Cefixime, Ciprofloxacin, Levofloxacin) AND `has_culture_report == False` AND `canonical_syndrome` has an established "Access" first-line alternative (e.g., Amoxicillin, Nitrofurantoin, Ampicillin).
   - **Action:** Flag non-adherence. Assign Class Penalty:
     $$P_{\text{class}} = 45$$
   - **Remediation:** De-escalate to standard Access regimen (e.g., switch from Cefixime to Amoxicillin for mild respiratory infection).
   - **Citation:** WHO AWaRe Classification 2023 & ICMR Antimicrobial Stewardship Guidelines.

2. **Rule 3.2: Reserve-Group "Air-Gap" Gate**
   - **Condition:** `drug.aware_tier == 'Reserve'` (e.g., Meropenem, Linezolid, Colistin, Tigecycline, Fosfomycin IV) in an outpatient consultation without positive microbiology/culture ID.
   - **Action:** Immediate administrative alert. Assign Class Penalty:
     $$P_{\text{class}} = 85$$
   - **Requirement:** Mandate infectious disease / clinical microbiologist sign-off prior to dispensing. Quarantine outpatient supply.
   - **Citation:** WHO Reserve Group Stewardship Protocol.

---

### Tier 4: Therapeutic Course & Duration Limits
*Prevents bacterial selective pressure and microbiome disruption caused by prolonged courses.*

1. **Rule 4.1: Community-Acquired Pneumonia (CAP) Duration Cap**
   - **Condition:** `canonical_syndrome == 'SYN_CAP_MILD'` (or mild CAP) AND `duration_days > 5`.
   - **Action:** Flag excessive course. Assign Duration Penalty:
     $$P_{\text{duration}} = (\text{duration\_days} - 5) \times 15$$
   - **Remediation:** Shorten duration to 5 days (as per ICMR protocol, assuming patient is afebrile for $\ge 48$ hours).
   - **Citation:** ICMR STG Community-Acquired Pneumonia.

2. **Rule 4.2: Uncomplicated Lower UTI (Cystitis) Duration Cap**
   - **Condition:** `canonical_syndrome == 'SYN_UNCOMPLICATED_UTI'`:
     - If `drug == 'Nitrofurantoin'` AND `duration_days > 5`:
       $$P_{\text{duration}} = (\text{duration\_days} - 5) \times 15$$
       *Remediation:* Cap duration at 5 days.
     - If `drug == 'Fosfomycin'` AND `duration_days > 1`:
       $$P_{\text{duration}} = (\text{duration\_days} - 1) \times 15$$
       *Remediation:* Enforce single sachet (1-day course) only.
   - **Citation:** ICMR STG Urinary Tract Infections & IDSA Guidelines.

---

### Tier 5: Local Pathogen Resistance Benchmarking (ICMR-AMRSN)
*Embeds ground-truth Indian epidemiological resistance surveillance into empirical prescribing.*

1. **Rule 5.1: Fluoroquinolone Resistance Penalty in UTIs**
   - **Condition:** `canonical_syndrome == 'SYN_UNCOMPLICATED_UTI'` AND drug is a fluoroquinolone (`Ciprofloxacin`, `Norfloxacin`, `Levofloxacin`, `Ofloxacin`).
   - **Action:** Flag high clinical failure probability.
   - **Citation:** ICMR-AMRSN surveillance confirms $>75\%$ resistance in uropathogenic *Escherichia coli* isolates across participating tertiary care centers nationwide.
   - **Remediation:** Switch empirical therapy to Nitrofurantoin (100 mg BID for 5 days) or single-dose oral Fosfomycin (3 g sachet), both retaining $>85\%$ national susceptibility.

---

## 3. Mathematical Scoring Model

### Failure Penalty Matrix

| Verification Level | Condition Checked | Pass Criteria | Failure Penalty |
| :--- | :--- | :--- | :--- |
| **Contraindication (Tier 1)** | Age $< 18$ / Pregnancy / Renal Elderly | Safe category only | **BLOCKED** ($Score = 100.0$) |
| **Indication (Tier 2)** | Viral / Self-limiting infections | No antibiotics prescribed | $P_{\text{indication}} = 100$ |
| **AWaRe Spectrum (Tier 3)** | Outpatient empirical selection | "Access" group used | $P_{\text{class}} = 45$ (Watch) / $85$ (Reserve) |
| **Duration (Tier 4)** | Course length vs ICMR cap | $\le \text{Guideline Limit}$ | $P_{\text{duration}} = (\Delta \text{days}) \times 15$ |
| **Formulation (Tier 2)** | Dual irrational FDCs | Rational single active agent | Flag as "Not Recommended" |
| **Resistance (Tier 5)** | Empirical FQ in UTI | Susceptible first-line agent | Flag high failure (>75% resistance) |

### Aggregate Score Formula
When no Tier 1 hard contraindication is tripped:

$$AMR\_Risk\_Score = \min\left(100.0, \; 0.4 \cdot P_{\text{class}} + 0.2 \cdot P_{\text{duration}} + 0.4 \cdot P_{\text{indication}}\right)$$

### Stewardship Triage Bands
- **RED (Critical / Blocked):** $AMR\_Risk\_Score \ge 75$ OR any Tier 1 Contraindication tripped (`BLOCKED`).
- **AMBER (Moderate Risk / Needs Review):** $35 \le AMR\_Risk\_Score < 75$.
- **GREEN (Compliant / Low Risk):** $AMR\_Risk\_Score < 35$.
