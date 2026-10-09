from pydantic import BaseModel, Field
from typing import Optional

class RemediationOption(BaseModel):
    recommendation_type: str = Field(
        ...,
        description="Type of intervention: SWITCH_DRUG, DISCONTINUE, REDUCE_DURATION, MANDATE_SYMPTOMATIC, MICROBIOLOGY_REQUIRED, CONTRAINDICATION_BLOCK"
    )
    suggested_drug: Optional[str] = Field(None, description="Suggested alternative antimicrobial or supportive agent")
    suggested_duration_days: Optional[int] = Field(None, description="Recommended course duration in days")
    guidance: str = Field(..., description="Actionable clinical guidance text")
    source_citation: Optional[str] = Field(None, description="Guideline citation (e.g. ICMR STG, WHO AWaRe)")
