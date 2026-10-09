import os
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.ingestion import IngestionResult

def process_okf_data(raw_content: str, data_type: str) -> IngestionResult:
    """
    Stochastic Edge: Pass messy OKF CSV/Markdown data to the LLM to get strict normalized records.
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    prompt = f"""
    You are an AMR-Guard data ingestion assistant.
    Extract the '{data_type}' data from the following OKF-formatted content (could be messy CSV or Markdown).
    Return the normalized data matching the requested schema.
    
    Content:
    {raw_content}
    """
    
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=IngestionResult,
            temperature=0.0,
        ),
    )
    
    return IngestionResult.model_validate_json(response.text)
