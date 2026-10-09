from fastapi import APIRouter, HTTPException
from app.schemas.stats import StatsResponse
from app.services.audit_service import get_stewardship_statistics

router = APIRouter()

@router.get("", response_model=StatsResponse)
@router.get("/", response_model=StatsResponse)
def get_stats():
    """
    Get real-time hospital antimicrobial stewardship statistics, AWaRe distribution,
    top safety violations, and ICMR-AMRSN national surveillance benchmarks.
    """
    try:
        return get_stewardship_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stewardship statistics: {str(e)}")
