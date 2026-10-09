from pydantic import BaseModel, Field
from typing import List, Optional

class Evidence(BaseModel):
    source_id: str
    summary: str
    relevance: str

class ContextBundle(BaseModel):
    is_safe: bool
    contraindications_found: List[str] = Field(default_factory=list)
    relevant_guidelines: List[str] = Field(default_factory=list)
    supporting_evidence: List[Evidence] = Field(default_factory=list)
