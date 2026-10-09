# AMR-Guard: Running Guide & Command Reference

This document provides a complete, copy-pasteable reference for installing, seeding, running, testing, and debugging **AMR-Guard** across both Windows and Unix environments.

---

## 📑 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Installation & Setup](#3-installation--setup)
4. [Database Seeding & Knowledge Ingestion](#4-database-seeding--knowledge-ingestion)
5. [Running in Development Mode](#5-running-in-development-mode)
6. [Running in Production / Monolith Mode](#6-running-in-production--monolith-mode)
7. [Running Test Suites](#7-running-test-suites)
8. [Live API Verification & cURL / PowerShell Examples](#8-live-api-verification--curl--powershell-examples)
9. [Key Project Documentation Links](#9-key-project-documentation-links)

---

## 1. Prerequisites

Ensure the following runtimes are installed on your system:
* **Python**: 3.10 or higher (`python --version`)
* **Node.js**: 18.0 or higher with npm (`node --version`, `npm --version`)
* **Database**: PostgreSQL with `pgvector` (e.g. Neon Serverless) or local SQLite (built-in fallback)
* **Make** *(Optional)*: GNU Make for running Makefile recipes, or use the direct PowerShell commands below.

---

## 2. Environment Configuration

From the `amr-guard` project directory:

```powershell
# Copy the example environment file
cp .env.example .env
```

Ensure your `.env` contains the required keys:

```ini
# Database Connection (Neon PostgreSQL with pgvector, or sqlite:///./amrguard.db)
DATABASE_URL=sqlite:///./amrguard.db

# OpenRouter / Gemini API Keys for Stochastic Edge parsing
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.5-flash-lite

# Environment Mode (dev or prod)
APP_ENV=dev
```

---

## 3. Installation & Setup

### Option A: Windows PowerShell Task Runner (`run.ps1`)
```powershell
cd "d:\Web Project\AMR\amr-guard"
.\run.ps1 install
```

### Option B: Linux / macOS / Git Bash (`Makefile`)
```bash
cd amr-guard
make install
```

### Option C: Manual Command Execution
```powershell
cd "d:\Web Project\AMR\amr-guard"

# 1. Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 4. Database Seeding & Knowledge Ingestion

Initialize database tables, extensions, and the clinical RAG knowledge base:

```powershell
# Activate venv if not already active
.\.venv\Scripts\activate

# 1. Create database schema and enable pgvector extension
python scripts/seed_db.py
# (Or using Make: make seed)

# 2. Ingest clinical guidelines into LlamaIndex PGVectorStore
python scripts/ingest_knowledge.py
# (Or using Make: make ingest-knowledge)

# 3. Ingest OKF (Open Knowledge Formulation) seed drug records
python scripts/ingest_okf.py --dir data/seed --type drugs
# (Or using Make: make ingest-okf)
```

---

## 5. Running in Development Mode

In development, the backend and frontend run in separate terminals with hot-reloading:

### Terminal 1: Backend API Server
```powershell
cd "d:\Web Project\AMR\amr-guard"
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
* **API Base URL**: `http://localhost:8000`
* **Interactive Swagger UI**: `http://localhost:8000/docs`
* **OpenAPI JSON Spec**: `http://localhost:8000/openapi.json`
* **Health Check**: `http://localhost:8000/api/v1/health`

### Terminal 2: Frontend Web Client
```powershell
cd "d:\Web Project\AMR\amr-guard\frontend"
npm run dev
```
* **Frontend Web App**: `http://localhost:3000`
* *Note: Next.js automatically rewrites `/api/v1/*` requests to `http://localhost:8000/api/v1/*`.*

---

## 6. Running in Production / Monolith Mode

In production, Next.js compiles to a static export (`output: 'export'`), which FastAPI mounts and serves directly via `StaticFiles(html=True)`. Only a single server is required.

```powershell
cd "d:\Web Project\AMR\amr-guard"
.\.venv\Scripts\activate

# 1. Build the static frontend bundle (outputs to frontend/out)
cd frontend
npm run build
cd ..

# 2. Start the unified FastAPI production server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
* **Application & API**: Available unified at `http://localhost:8000`
* *(Or using Make: `make run`)*

---

## 7. Running Test Suites

AMR-Guard includes unit, integration, RAG re-ranking, and architectural boundary tests:

```powershell
cd "d:\Web Project\AMR\amr-guard"

# Run all 56 tests across the entire codebase
$env:PYTHONPATH="."; .\.venv\Scripts\pytest

# Run tests with verbose output
$env:PYTHONPATH="."; .\.venv\Scripts\pytest -v

# Run specific test suites:
# 1. Backend REST API tests (Health, Docs, 5-Tier Audits)
$env:PYTHONPATH="."; .\.venv\Scripts\pytest tests/test_backend_api.py

# 2. Reciprocal Rank Fusion (RRF) Reranker & BM25 tests
$env:PYTHONPATH="."; .\.venv\Scripts\pytest tests/test_reranker.py

# 3. Clinical Rules & Scoring Engine tests
$env:PYTHONPATH="."; .\.venv\Scripts\pytest tests/test_rules.py tests/test_scoring.py

# 4. AST Architectural Conformance (ensures Engine never imports LLMs/SDKs)
$env:PYTHONPATH="."; .\.venv\Scripts\pytest tests/test_architecture.py
```

---

## 8. Live API Verification & cURL / PowerShell Examples

### A. Health Check Endpoint
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get
```
*Or using cURL:*
```bash
curl -X GET http://127.0.0.1:8000/api/v1/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "service": "AMR-Guard API"
}
```

### B. Prescription Audit Endpoint (`POST /api/v1/audit/`)

#### Example 1: Pediatric Fluoroquinolone Hard Contraindication (Tier 1)
```powershell
$body = @{
    patient = @{ age_years = 14; sex = "M"; is_pregnant = $false }
    prescription_lines = @(@{ drug_name = "Ciprofloxacin"; duration_days = 5 })
    canonical_syndrome = "SYN_UNCOMPLICATED_UTI"
    is_outpatient = $true
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/audit/" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```
**Expected Response:**
```json
{
  "status": "BLOCKED",
  "score": 100.0,
  "band": "RED",
  "flags": [
    {
      "tier": 1,
      "rule_id": "TIER1_PEDIATRIC_CONTRAINDICATION",
      "severity": "BLOCKED",
      "drug": "Ciprofloxacin",
      "rationale": "Patient age 14 < 18 years. Fluoroquinolones carry high risk of irreversible musculoskeletal/cartilage damage..."
    }
  ]
}
```

#### Example 2: Clean First-Line Approved Prescription
```powershell
$body = @{
    patient = @{ age_years = 32; sex = "M"; is_pregnant = $false }
    prescription_lines = @(@{ drug_name = "Amoxicillin"; duration_days = 5 })
    canonical_syndrome = "SYN_CAP_MILD"
    is_outpatient = $true
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/audit/" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```
**Expected Response:**
```json
{
  "status": "APPROVED",
  "score": 0.0,
  "band": "GREEN",
  "flags": [],
  "remediation_options": []
}
```

---

## 9. Key Project Documentation Links

| Document | Purpose |
| :--- | :--- |
| [docs/tech-stack.md](file:///d:/Web%20Project/AMR/amr-guard/docs/tech-stack.md) | Full end-to-end technology stack, libraries, versions, and RRF reranking architecture. |
| [docs/rules-spec.md](file:///d:/Web%20Project/AMR/amr-guard/docs/rules-spec.md) | Clinical rules checklist (R1–R7), penalty formulas, and evidence citations. |
| [docs/REQUIREMENTS.md](file:///d:/Web%20Project/AMR/amr-guard/docs/REQUIREMENTS.md) | Product requirements, non-goals, and P0/P1 feature roadmap. |
| [docs/architecture.md](file:///d:/Web%20Project/AMR/amr-guard/docs/architecture.md) | High-level system architecture and architectural boundaries. |
| [Makefile](file:///d:/Web%20Project/AMR/amr-guard/Makefile) | Standard automation targets for building and running. |
