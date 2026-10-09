# Implementation Plan: Complete Patient Context Safety Engine

**Goal:** Expand AMR-Guard's verification pipeline to achieve 100% complete consideration of patient-specific parameters—including documented Drug Allergies, Comorbidity Black-Box Warnings, and Pediatric Weight-Based Dosing thresholds from verified authoritative sources.

---

## 1. Verified Clinical Reference Data

### 1.1 Drug Allergy Class Matrix
Derived from **FDA Monograph Warnings**, **British National Formulary (BNF)**, and **ICMR STG 2022**:
- **Penicillin Allergy Class**:
  - Direct class: `amoxicillin`, `ampicillin`, `piperacillin`, `cloxacillin`, `oxacillin`, `penicillin v`, `benzylpenicillin`, `amox-clav`, `co-amoxiclav`, `tazobactam`.
  - Low-risk cross-reactivity ($\sim 1\text{--}2\%$): 1st/2nd/3rd gen cephalosporins (`cefixime`, `ceftriaxone`, `cefuroxime`, `cefpodoxime`, `cefalexin`, `cefazolin`), carbapenems (`meropenem`, `imipenem`).
- **Sulfonamide / Sulfa Allergy Class**:
  - Direct class: `co-trimoxazole`, `cotrimoxazole`, `trimethoprim-sulfamethoxazole`, `sulfamethoxazole`, `bactrim`, `septra`.
- **Fluoroquinolone Allergy Class**:
  - Direct class: `ciprofloxacin`, `levofloxacin`, `ofloxacin`, `moxifloxacin`, `norfloxacin`, `gemifloxacin`.
- **Macrolide Allergy Class**:
  - Direct class: `azithromycin`, `clarithromycin`, `erythromycin`, `roxithromycin`.
- **Cephalosporin Allergy Class**:
  - Direct class: all cephalosporins (`cef-`, `ceph-`).

### 1.2 Comorbidity Black-Box Matrix
Derived from **FDA Black Box Warnings**, **ICMR Guidelines**, and **Goodman & Gilman Pharmacological Basis of Therapeutics**:
- **Myasthenia Gravis**:
  - **Tier 1 Fatal Contraindication**: Fluoroquinolones (Black Box: neuromuscular blockade exacerbation causing fatal respiratory depression) and Aminoglycosides (neuromuscular blockade).
- **G6PD Deficiency**:
  - **Tier 1 Fatal Contraindication**: Nitrofurantoin, Sulfonamides/Co-trimoxazole (severe acute hemolytic crisis).
- **Long QT Syndrome / Cardiac Arrhythmia**:
  - **Tier 2 High Warning**: Fluoroquinolones and Macrolides (prolonged QT interval, Torsades de Pointes).
- **Epilepsy / Seizure Disorder**:
  - **Tier 2 High Warning**: High-dose Carbapenems, especially Imipenem-Cilastatin (lowers seizure threshold).

### 1.3 Pediatric Weight-Based Dosing Ceilings (Verified Sources)
Derived from **ICMR Treatment Guidelines for Antimicrobial Use in Pediatrics 2023** & **WHO Model Formulary for Children**:
- **Amoxicillin**:
  - Standard: $40\text{--}50\text{ mg/kg/day}$ in divided doses.
  - High-dose otitis media: Up to $80\text{--}90\text{ mg/kg/day}$.
  - Overdose Ceiling: $> 100\text{ mg/kg/day}$ triggers Tier 1 Overdose Stop.
- **Amoxicillin-Clavulanate**:
  - Standard: $40\text{--}45\text{ mg/kg/day}$ (amoxicillin component).
  - Overdose Ceiling: $> 90\text{ mg/kg/day}$.
- **Cefixime**:
  - Standard: $8\text{ mg/kg/day}$ (max $400\text{ mg/day}$).
  - Overdose Ceiling: $> 16\text{ mg/kg/day}$.
- **Azithromycin**:
  - Standard: $10\text{ mg/kg/day}$ on Day 1, then $5\text{ mg/kg/day}$ x 4 days (or $10\text{ mg/kg/day}$ x 3 days, max $500\text{ mg/day}$).
  - Overdose Ceiling: $> 20\text{ mg/kg/day}$.
- **Ciprofloxacin / Fluoroquinolones**:
  - Standard: Already blocked in pediatrics under Tier 1.1.

---

## 2. Phased Implementation Tasks

### Task 1: Schema & Data Pipeline Expansion (TDD)
- **Files:**
  - `app/schemas/patient.py`: Add `allergies: Optional[str] = "NKDA"`, `medical_history: Optional[str] = None`.
  - `frontend/src/lib/api.ts`: Ensure `allergies`, `medical_history`, `route`, `is_nephrotoxic`, `requires_egfr`, and `outpatient_iv_restricted` are transmitted in `POST /api/v1/audit/`.
  - `app/services/prescription_service.py`: Map all patient and medicine fields into `PatientContext` and `PrescriptionLine`.
- **Test:** Write tests in `tests/test_patient_schema.py` verifying full field serialization.

### Task 2: Tier 1 Drug Allergy Safety Gate (TDD)
- **Files:**
  - `app/engine/constraints.py`: Define allergy dictionaries and cross-reactivity mapping.
  - `app/engine/rules.py`: Implement `check_drug_allergy_contraindications(patient, line)`.
  - `app/engine/rule_registry.py`: Register `TIER1_DRUG_ALLERGY_CONTRAINDICATION` and `TIER2_ALLERGY_CROSS_REACTIVITY_WARNING`.
- **Test:** `tests/test_allergy_rules.py`:
  - Test Penicillin allergy + Amoxicillin $\rightarrow$ `BLOCKED` (100.0).
  - Test Sulfa allergy + Co-trimoxazole $\rightarrow$ `BLOCKED` (100.0).
  - Test Penicillin allergy + Cefixime (3rd gen) $\rightarrow$ `HIGH` (60.0).
  - Test NKDA $\rightarrow$ `None`.

### Task 3: Comorbidity Black-Box Warning Gate (TDD)
- **Files:**
  - `app/engine/constraints.py`: Define comorbidity contraindication maps.
  - `app/engine/rules.py`: Implement `check_comorbidity_contraindications(patient, line)`.
  - `app/engine/rule_registry.py`: Register `TIER1_COMORBIDITY_FATAL_CONTRAINDICATION` and `TIER2_COMORBIDITY_SERIOUS_WARNING`.
- **Test:** `tests/test_comorbidity_rules.py`:
  - Test Myasthenia Gravis + Ciprofloxacin $\rightarrow$ `BLOCKED` (100.0).
  - Test G6PD Deficiency + Nitrofurantoin $\rightarrow$ `BLOCKED` (100.0).
  - Test Long QT + Azithromycin $\rightarrow$ `HIGH` (60.0).
  - Test Epilepsy + Imipenem $\rightarrow$ `HIGH` (60.0).

### Task 4: Pediatric Weight-Based Overdose Verification Gate (TDD)
- **Files:**
  - `app/engine/rules.py`: Implement `check_pediatric_weight_dosing(patient, line)`.
  - Parse daily dose from `line.strength` (e.g. "500 mg", "1g", "250 mg/5ml") and `line.frequency` ("OD", "BD", "TDS", "QID").
  - Compare daily dose / `patient.weight_kg` against verified maximum ceiling.
  - Register `TIER1_PEDIATRIC_WEIGHT_OVERDOSE` and `TIER4_PEDIATRIC_DOSAGE_ADVISORY`.
- **Test:** `tests/test_pediatric_weight_dosing.py`:
  - Test 15 kg child + Amoxicillin 1000 mg TDS (200 mg/kg/day vs max 90) $\rightarrow$ `BLOCKED` (100.0).
  - Test 15 kg child + Amoxicillin 250 mg TDS (50 mg/kg/day) $\rightarrow$ `None` (Approved).

### Task 5: Client-Side Parity & Synchronized Evaluation
- **Files:**
  - `frontend/src/lib/api.ts`: Update `evaluateDeterministicRules` with allergy matching, comorbidity checks, and weight-based overdose checks for offline parity.
- **Verification:** Run `npm --prefix frontend run build`.

### Task 6: Full Regression & Benchmark Evaluation
- Run full pytest suite (`pytest tests/ -v`).
- Run `python3 scripts/eval_benchmark.py`.
- Verify zero regressions and 100% test pass.
