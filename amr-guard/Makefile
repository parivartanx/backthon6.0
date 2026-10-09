.PHONY: install dev-backend dev-frontend build-frontend run seed test

install:
	pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

build-frontend:
	cd frontend && npm run build

run: build-frontend
	uvicorn app.main:app --host 0.0.0.0 --port 8000

seed:
	python scripts/seed_db.py

ingest-okf:
	python scripts/ingest_okf.py --dir data/seed --type drugs

ingest-knowledge:
	python scripts/ingest_knowledge.py

test:
	pytest
