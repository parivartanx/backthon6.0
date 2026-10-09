from fastapi import APIRouter
from app.api.v1 import health, extract, audit, remediate, stats

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(extract.router, prefix="/extract", tags=["extract"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(remediate.router, prefix="/remediate", tags=["remediate"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
