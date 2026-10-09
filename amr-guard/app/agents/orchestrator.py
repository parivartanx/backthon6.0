import json
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.tools import search_amr_knowledge
from app.schemas.orchestrator import ContextBundle

def run_verification_orchestrator(clinical_scenario: str) -> ContextBundle:
    """
    Custom Agent Loop: Uses tools to gather context and returns a strict ContextBundle.
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    system_instruction = (
        "You are an AMR Verification Agent. You must use the `search_amr_knowledge` tool to "
        "investigate the clinical scenario. Once you have enough context, stop and "
        "format your final output strictly according to the ContextBundle schema."
    )
    
    # In a full custom loop, you would manage a `messages` array, check for 
    # `function_call` inside `response.function_calls`, execute the Python tool, 
    # append the `function_response` to messages, and loop until the model returns text.
    # For this stub, we simulate one tool invocation.
    
    print(f"[Orchestrator] Thinking about: {clinical_scenario}")
    
    # Simulated tool call decision
    tool_response_text = search_amr_knowledge(clinical_scenario)
    print(f"[Orchestrator] Tool returned: {tool_response_text}")
    
    prompt = f"""
    Evaluate this scenario using the retrieved knowledge.
    
    Scenario: {clinical_scenario}
    
    Retrieved Knowledge:
    {tool_response_text}
    """
    
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=ContextBundle,
            temperature=0.0,
        ),
    )
    
    return ContextBundle.model_validate_json(response.text)
