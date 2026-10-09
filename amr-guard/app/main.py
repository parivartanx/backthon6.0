import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import api_router
from app.api.v1 import extract, audit, remediate, stats, knowledge, prescriptions, health

app = FastAPI(title="AMR-Guard API")

# CORS Middleware for cross-origin requests (e.g. Next.js, tunnels, external clients)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Versioned API routes (/api/v1/...)
app.include_router(api_router, prefix="/api/v1")

# Direct unversioned route aliases (/extract, /audit, /prescriptions, etc.)
# Allows clients and external tools calling root routes without '/api/v1' to work seamlessly
app.include_router(extract.router, prefix="/extract", tags=["extract"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(remediate.router, prefix="/remediate", tags=["remediate"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
app.include_router(health.router, prefix="/health", tags=["health"])

# Mount static frontend
frontend_out_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")

if os.path.exists(frontend_out_dir):
    app.mount("/", StaticFiles(directory=frontend_out_dir, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "Frontend not built yet. Run `make build-frontend`."}
