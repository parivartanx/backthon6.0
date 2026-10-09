from pydantic import BaseModel
from typing import List

class AuditResult(BaseModel):
    flags: List[dict]
    score: float
    band: str
    remediation_options: List[dict]
    latency_ms: int
