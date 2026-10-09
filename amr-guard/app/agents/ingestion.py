import os
import json
from openai import OpenAI
from app.core.config import settings
from app.schemas.ingestion import IngestionResult

def process_okf_data(raw_content: str, data_type: str) -> IngestionResult:
    """
    Stochastic Edge: Pass messy OKF CSV/Markdown data to the LLM to get strict normalized records.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )
    
    prompt = f"""
    You are an AMR-Guard data ingestion assistant.
    Extract the '{data_type}' data from the following OKF-formatted content (could be messy CSV or Markdown).
    Return the normalized data strictly as JSON matching the requested schema.
    
    Schema:
    {IngestionResult.model_json_schema()}
    
    Content:
    {raw_content}
    """
    
    response = client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a data extraction assistant. Always output JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
    )
    
    return IngestionResult.model_validate_json(response.choices[0].message.content)
