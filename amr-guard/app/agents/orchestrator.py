import os
import json
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END
from openai import OpenAI
from app.core.config import settings
from app.schemas.orchestrator import ContextBundle
from app.agents.tools import search_amr_knowledge

# 1. Define State
class AgentState(TypedDict):
    scenario: str
    search_queries: list[str]
    retrieved_context: list[str]
    bundle: str # Storing the JSON output string

# 2. Define Nodes
def analyze_node(state: AgentState):
    """Decides what queries to run based on the scenario."""
    # Stub: just query the whole scenario
    queries = state.get("search_queries", [])
    if not queries:
        queries.append(state["scenario"])
    return {"search_queries": queries}

def search_node(state: AgentState):
    """Executes the LlamaIndex tool."""
    contexts = state.get("retrieved_context", [])
    query = state["search_queries"][-1]
    
    # Use our tool which in a real implementation calls LlamaIndex
    result = search_amr_knowledge(query)
    
    contexts.append(result)
    return {"retrieved_context": contexts}

def format_node(state: AgentState):
    """Uses OpenRouter to build the strict ContextBundle."""
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )
    
    prompt = f"""
    Evaluate this scenario.
    
    Scenario: {state["scenario"]}
    
    Retrieved Knowledge: 
    {state["retrieved_context"]}
    
    Respond STRICTLY in JSON matching this schema:
    {ContextBundle.model_json_schema()}
    """
    
    response = client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an AMR Verification Agent."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
    )
    return {"bundle": response.choices[0].message.content}

# 3. Build Graph
workflow = StateGraph(AgentState)
workflow.add_node("analyze", analyze_node)
workflow.add_node("search", search_node)
workflow.add_node("format", format_node)

workflow.set_entry_point("analyze")
workflow.add_edge("analyze", "search")
workflow.add_edge("search", "format")
workflow.add_edge("format", END)

app = workflow.compile()

def run_verification_orchestrator(clinical_scenario: str) -> ContextBundle:
    """Executes the LangGraph workflow."""
    print(f"[Orchestrator] Starting LangGraph for: {clinical_scenario}")
    
    initial_state = {
        "scenario": clinical_scenario,
        "search_queries": [],
        "retrieved_context": [],
        "bundle": ""
    }
    
    result = app.invoke(initial_state)
    bundle_json = result["bundle"]
    
    return ContextBundle.model_validate_json(bundle_json)
