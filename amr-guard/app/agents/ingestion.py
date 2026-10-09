import os
import json
from openai import OpenAI
from app.core.config import settings
from app.schemas.ingestion import IngestionResult
from app.agents.prompts import PromptFactory

def process_okf_data(raw_content: str, data_type: str) -> IngestionResult:
    """
    Stochastic Edge: Pass messy OKF CSV/Markdown data to the LLM to get strict normalized records.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )
    
    prompt_strategy = PromptFactory.create_ingestion_prompt(
        raw_content=raw_content,
        data_type=data_type,
        target_schema=IngestionResult,
    )
    
    response = client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        response_format={"type": "json_object"},
        messages=prompt_strategy.build_messages(),
        temperature=0.0,
    )
    
    return IngestionResult.model_validate_json(response.choices[0].message.content)
