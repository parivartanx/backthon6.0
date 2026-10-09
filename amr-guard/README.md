# AMR-Guard

A clinical prescription auditing tool for outpatient antimicrobial resistance.

AMR-Guard is designed to tackle the growing problem of Antimicrobial Resistance (AMR) by auditing outpatient prescriptions. It follows a strict **"Stochastic Edge, Deterministic Core"** principle: LLM agents are strictly used for data extraction and normalization, while a pure-Python rules engine makes every clinical decision.

## 🏗 Architecture

AMR-Guard is a single-repo monolith:
- **Backend**: FastAPI server that handles all API requests (`/api/v1/*`).
- **Frontend**: Next.js (App Router, TypeScript) frontend built as a static export (`next build` with `output: 'export'`).
- **Database**: SQLAlchemy 2.x with SQLite as the default database (PostgreSQL supported via `DATABASE_URL`).
- **Production Server**: The FastAPI app serves both the API and the static frontend build via `StaticFiles(html=True)`, ensuring a simplified, single-server deployment.

## 🚀 Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup

1. **Set up environment variables:**
   ```bash
   cd amr-guard
   cp .env.example .env
   # Ensure you fill in the GEMINI_API_KEY in the .env file
   ```

2. **Install dependencies:**
   *(Note: For Windows, you may need to use a virtual environment instead of `make`)*
   ```bash
   make install
   ```
   **Windows Manual Alternative:**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   cd frontend
   npm install
   cd ..
   ```

3. **Seed the Database:**
   ```bash
   make seed
   ```

### Development Mode
Run the backend and frontend in separate terminals:

**Terminal 1 (Backend):**
```bash
make dev-backend
```
*Backend runs on `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.*

**Terminal 2 (Frontend):**
```bash
make dev-frontend
```
*Frontend runs on `http://localhost:3000`. API calls are proxied to the backend via Next.js rewrites.*

### Production / Demo Mode
Build the frontend and serve it entirely from the FastAPI backend.

```bash
make run
```
*The app will be available at `http://localhost:8000`.*

## 📁 Project Structure

- `app/agents/`: LLM agents for extracting and normalizing data from prescriptions (Stochastic Edge).
- `app/engine/`: Pure Python rules engine for scoring and auditing (Deterministic Core). **Strict rule:** Cannot import from `app/agents/` or any LLM SDK.
- `app/api/v1/`: FastAPI endpoints for extraction, auditing, and remediation.
- `app/schemas/`: Pydantic models defining data shapes.
- `app/db/`: SQLAlchemy models, session, and repositories.
- `frontend/`: Next.js frontend application.
- `data/seed/`: CSV files containing medical data (drugs, brands, conditions, guidelines).
- `docs/`: Design and requirement documents.

## 🧪 Testing

Run the test suite, which includes architecture constraints and core engine logic:
```bash
make test
```
*(On Windows: `.\.venv\Scripts\pytest`)*
