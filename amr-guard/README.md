# AMR-Guard

A clinical prescription auditing tool for outpatient antimicrobial resistance.

## Quickstart

1. `cp .env.example .env` (fill in GEMINI_API_KEY)
2. `make install`
3. `make seed`
4. `make dev-backend` & `make dev-frontend` (in separate terminals)
5. `make run` (for a static build of the frontend served by FastAPI)
