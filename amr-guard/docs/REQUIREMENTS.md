# AMR-Guard System Requirements

## 1. System Goals
- Provide deterministic, mathematically bounded prescription auditing for antimicrobial stewardship.
- Protect patient safety with zero tolerance for hard contraindications (pediatric safety, pregnancy, renal vulnerability).
- Enforce evidence-based stewardship derived from ICMR Standard Treatment Guidelines (STG) and WHO AWaRe Framework.
- Leverage real Indian antimicrobial surveillance data (ICMR-AMRSN) to combat empiric resistance traps.
- Separate stochastic text parsing (LangGraph + OpenRouter LLMs) from the deterministic verification engine (pure Python).

## 2. Non-Goals
- Replacing clinical diagnosis or substituting for qualified physician judgment.
- Modifying patient records without pharmacist/clinician sign-off.
- Using LLMs for clinical scoring calculations or mathematical threshold evaluations.

## 3. P0/P1 Features
- **P0: Five-Tier Deterministic Verification Pipeline**
  - Tier 1: Patient Safety & Hard Contraindication Gates (Pediatric, Pregnancy, Renal/Age).
  - Tier 2: Indication & Diagnosis Legitimacy (Viral self-limiting gate, irrational FDC filter).
  - Tier 3: WHO AWaRe Spectrum Escalation (Watch group de-escalation, Reserve group air-gap).
  - Tier 4: Therapeutic Course & Duration Limits (CAP cap, UTI Nitrofurantoin/Fosfomycin caps).
  - Tier 5: Local Pathogen Resistance Benchmarking (ICMR-AMRSN UTI FQ penalty).
- **P0: Deterministic Scoring & Triage Engine**
  - Mathematical penalty formula: $AMR\_Risk\_Score = \min(100, 0.4 \cdot P_{class} + 0.2 \cdot P_{duration} + 0.4 \cdot P_{indication})$.
  - Instant `BLOCKED` triage for Tier 1 violations.
  - Triage Risk Bands (RED, AMBER, GREEN).
  - Actionable remediation generation.
- **P1: Hybrid RAG Agent Orchestrator**
  - LangGraph workflow with LlamaIndex + Neon PGVector tool integration.
  - OpenRouter structured context bundle extraction.
- **P1: Audit API (`/api/v1/audit`)**
  - Endpoints to accept clinical scenarios or structured prescription requests and return audited results.

## 4. Five-Tier Verification Rules Checklist (R1–R7)

- [x] **R1: Pediatric Fluoroquinolone / Tetracycline Ban (Tier 1)**
  - Hard block if age < 18 and prescribed FQs or Tetracyclines.
- [x] **R2: Pregnancy Safety Gate (Tier 1)**
  - Hard block if pregnant and prescribed Category D/X or unapproved antimicrobials.
- [x] **R3: Renal Clearance / Age Restriction for Nitrofurantoin (Tier 1)**
  - Hard block if Nitrofurantoin prescribed to age $\ge 65$ or eGFR $< 30$ mL/min.
- [x] **R4: Viral / Self-Limiting Infection Gate (Tier 2)**
  - Penalty $P_{indication} = 100$ if antibiotic prescribed for self-limiting viral syndromes.
- [x] **R5: Unapproved Fixed-Dose Combination (FDC) Filter (Tier 2)**
  - Flag irrational dual-antibiotic or banned FDCs (e.g. Ofloxacin + Ornidazole).
- [x] **R6: WHO AWaRe Spectrum Escalation Gates (Tier 3)**
  - Penalty $P_{class} = 45$ for empirical Watch antibiotics with Access alternative.
  - Penalty $P_{class} = 85$ for outpatient Reserve antibiotics without culture.
- [x] **R7: Therapeutic Duration & Resistance Limits (Tier 4 & Tier 5)**
  - CAP duration capped at 5 days ($P_{duration} = (\Delta d) \times 15$).
  - Uncomplicated UTI duration capped at 5 days for Nitrofurantoin, 1 day for Fosfomycin.
  - UTI Fluoroquinolone resistance flag citing ICMR-AMRSN $>75\%$ resistance in *E. coli*.
