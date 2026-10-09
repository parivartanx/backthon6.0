import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import api_router

app = FastAPI(title="AMR-Guard API")

# API routes
app.include_router(api_router, prefix="/api/v1")

# Mount static frontend
frontend_out_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(frontend_out_dir):
    app.mount("/", StaticFiles(directory=frontend_out_dir, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "Frontend not built yet. Run `make build-frontend`."}
