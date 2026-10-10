# Contributing to AMR-Guard

Thank you for your interest in contributing to **AMR-Guard**! We welcome contributions from software engineers, clinical pharmacologists, infectious disease specialists, and antimicrobial stewardship professionals.

AMR-Guard is dedicated to preventing inappropriate antimicrobial prescribing and combating Antimicrobial Resistance (AMR). Because this platform impacts clinical decision support, we adhere to strict architectural, safety, and evidence standards.

---

## 📑 Table of Contents

1. [Architectural Golden Rule: Stochastic Edge, Deterministic Core](#1-architectural-golden-rule)
2. [Code of Conduct & Clinical Integrity](#2-code-of-conduct--clinical-integrity)
3. [Development Environment Setup](#3-development-environment-setup)
4. [Branching & Commit Guidelines](#4-branching--commit-guidelines)
5. [How to Add or Update Clinical Verification Rules](#5-how-to-add-or-update-clinical-verification-rules)
6. [Frontend Development Guidelines](#6-frontend-development-guidelines)
7. [Testing & Quality Assurance](#7-testing--quality-assurance)
8. [Pull Request Checklist](#8-pull-request-checklist)

---

## 1. Architectural Golden Rule

> [!IMPORTANT]
> **STRICT ARCHITECTURAL SEPARATION:**  
> The deterministic clinical core (`app/engine/`) **MUST NEVER** import from `app/agents/`, `openai`, `google`, `langgraph`, `llama_index`, or any AI/LLM SDK.

Every clinical safety decision, contraindication gate, duration limit, and mathematical penalty score must be:
* **100% Deterministic:** Same input always yields the exact same score and triage outcome.
* **Citable:** Grounded in an authoritative guideline (ICMR STG, WHO AWaRe 2023, CDSCO Gazette, or ICMR-AMRSN).
* **AST Verified:** Validated by `tests/test_architecture.py`, which parses Python ASTs at build time to reject any forbidden imports.

AI agents are strictly confined to the **Stochastic Edge** (`app/agents/`) for natural language extraction, handwriting/OCR parsing, and entity normalization.

---

## 2. Code of Conduct & Clinical Integrity

* **Safety First:** Hard contraindications (Pediatric FQ/Tetracyclines, Pregnancy FDA Cat D/X, Geriatric Renal Clearance) must remain zero-tolerance (`BLOCKED`, $Score = 100.0$).
* **Evidence-Based Changes:** Any proposed change to drug classifications, AWaRe categories, or duration caps must include a published clinical citation.
* **Respectful Collaboration:** We foster an inclusive, constructive, and evidence-driven community.

---

## 3. Development Environment Setup

### Prerequisites
* **Python**: 3.10+
* **Node.js**: 18.0+ with npm
* **Git**

### Installation Steps

1. **Fork and Clone the Repository:**
   ```bash
   git clone https://github.com/<your-username>/amr-guard.git
   cd amr-guard
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```

3. **Install Backend Dependencies:**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Seed the Local Database:**
   ```bash
   # Populates drugs, Indian trade brands, regimens, and guidelines
   python scripts/seed_db.py
   ```

6. **Verify the Test Suite Passes:**
   ```bash
   pytest
   ```

---

## 4. Branching & Commit Guidelines

* Create focused branches from `main`:
  * `feat/<feature-name>` for new functionality
  * `fix/<bug-name>` for bug fixes
  * `rules/<rule-name>` for adding or refining clinical verification rules
  * `docs/<topic>` for documentation improvements
* Follow [Conventional Commits](https://www.conventionalcommits.org/):
  * `feat: add renal dosing safeguard for aminoglycosides`
  * `fix(engine): correct Fosfomycin single-dose duration check`
  * `test(rules): add pediatric fluoroquinolone edge case test`
  * `docs: update API documentation for /remediate`

---

## 5. How to Add or Update Clinical Verification Rules

When introducing a new verification rule or modifying an existing gate:

1. **Check or Add Drug Constants:**  
   If new drug classifications or lists are required, update [app/engine/constraints.py](file:///c:/Users/pulak/Downloads/AMR/backthon6.0/amr-guard/app/engine/constraints.py).
2. **Implement the Rule Function:**  
   Add the deterministic logic in [app/engine/rules.py](file:///c:/Users/pulak/Downloads/AMR/backthon6.0/amr-guard/app/engine/rules.py).  
   Ensure the function takes typed inputs (`PatientContext`, `PrescriptionLine`) and returns an optional `RuleViolation`.
3. **Register the Rule:**  
   Add rule metadata and wire the execution in [app/engine/rule_registry.py](file:///c:/Users/pulak/Downloads/AMR/backthon6.0/amr-guard/app/engine/rule_registry.py).
4. **Implement Remediation Pathways:**  
   If the rule flags a non-compliant regimen, define actionable de-escalation suggestions in [app/engine/remediation.py](file:///c:/Users/pulak/Downloads/AMR/backthon6.0/amr-guard/app/engine/remediation.py).
5. **Add Comprehensive Unit Tests:**  
   Write positive, negative, and edge-case unit tests in [tests/test_rules.py](file:///c:/Users/pulak/Downloads/AMR/backthon6.0/amr-guard/tests/test_rules.py).
6. **Benchmark Validation:**  
   Add relevant test cases to [scripts/eval_benchmark.py](file:///c:/Users/pulak/Downloads/AMR/backthon6.0/amr-guard/scripts/eval_benchmark.py).

---

## 6. Frontend Development Guidelines

The frontend is built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

* **Static Export Compatibility:** The production build compiles to a static export (`output: 'export'`) served by FastAPI. Avoid Node-only server runtimes in route handlers; all API communication must go through `/api/v1/*`.
* **State Management:** Use Zustand stores (`frontend/src/store/`) for client state.
* **Component Design:** Adhere to Single Responsibility and modularity. Use Lucide React icons and accessible Radix UI primitives.
* **Testing Builds:** Before opening a PR, always confirm the static build succeeds:
  ```bash
  cd frontend
  npm run build
  cd ..
  ```

---

## 7. Testing & Quality Assurance

Before submitting any code, verify that all test suites pass:

```bash
# 1. Run all test suites
pytest

# 2. Verify architectural isolation (AST boundary test)
pytest tests/test_architecture.py

# 3. Verify clinical rules & scoring
pytest tests/test_rules.py tests/test_scoring.py

# 4. Verify hybrid RRF reranker
pytest tests/test_reranker.py

# 5. Verify API endpoints
pytest tests/test_backend_api.py

# 6. Run clinical gold-standard benchmark
python scripts/eval_benchmark.py
```

---

## 8. Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code adheres to the **"Stochastic Edge, Deterministic Core"** separation.
- [ ] No LLM/AI imports exist in `app/engine/` (`pytest tests/test_architecture.py` passes).
- [ ] All 56+ existing tests pass, plus new tests covering your changes.
- [ ] Clinical rule additions cite authoritative guidelines in docstrings and violations.
- [ ] Frontend static export compiles without errors (`npm run build`).
- [ ] Branch is rebased against the latest `main`.
- [ ] PR description clearly explains the clinical motivation and engineering changes.

---

Thank you for helping safeguard global antimicrobial efficacy with **AMR-Guard**!
