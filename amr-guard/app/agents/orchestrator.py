import json
from openai import OpenAI
from app.core.config import settings
from app.agents.tools import search_amr_knowledge
from app.schemas.orchestrator import ContextBundle

def run_verification_orchestrator(clinical_scenario: str) -> ContextBundle:
    """
    Custom Agent Loop: Uses tools to gather context and returns a strict ContextBundle.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )
    
    system_instruction = (
        "You are an AMR Verification Agent. You must use the `search_amr_knowledge` tool to "
        "investigate the clinical scenario. Once you have enough context, stop and "
        "format your final output strictly according to the ContextBundle schema. "
        "You must respond in JSON format matching the schema."
    )
    
    print(f"[Orchestrator] Thinking about: {clinical_scenario}")
    
    # Simulated tool call decision
    tool_response_text = search_amr_knowledge(clinical_scenario)
    print(f"[Orchestrator] Tool returned: {tool_response_text}")
    
    prompt = f"""
    Evaluate this scenario using the retrieved knowledge.
    
    Scenario: {clinical_scenario}
    
    Retrieved Knowledge:
    {tool_response_text}
    
    Schema:
    {ContextBundle.model_json_schema()}
    """
    
    response = client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
    )
    
    return ContextBundle.model_validate_json(response.choices[0].message.content)
