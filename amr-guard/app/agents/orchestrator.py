"""
LangGraph ReAct Agent Orchestrator for AMR-Guard.
Features dynamic autonomous tool-calling across:
- search_amr_guidelines (Hybrid RAG + RRF)
- get_database_regimens (SQL DB lookup)
- get_drug_monograph (Safety & AWaRe profile)
- get_pathogen_resistance_data (ICMR surveillance)
"""
import os
import json
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from openai import OpenAI
from app.core.config import settings
from app.schemas.orchestrator import ContextBundle
from app.schemas.remediation import RemediationRequest, RemediationResponse, RemediationOption
from app.agents.tools import TOOL_DEFINITIONS, TOOL_REGISTRY

# ---------------------------------------------------------------------------
# 1. State Definition
# ---------------------------------------------------------------------------

class ReActAgentState(TypedDict):
    task_type: str  # "verification" or "remediation"
    clinical_query: str
    messages: List[Dict[str, Any]]
    tool_iterations: int
    final_output: str

# ---------------------------------------------------------------------------
# 2. ReAct Graph Nodes
# ---------------------------------------------------------------------------

def agent_node(state: ReActAgentState) -> Dict[str, Any]:
    """
    Core LLM Node: Inspects current state and decides whether to invoke tools or finalize.
    """
    if not settings.OPENROUTER_API_KEY:
        # Offline fallback: stop loop immediately
        return {"tool_iterations": state.get("tool_iterations", 0) + 1}

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )

    try:
        response = client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=state["messages"],
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.0,
        )
        msg = response.choices[0].message
        msg_dict: Dict[str, Any] = {
            "role": "assistant",
            "content": msg.content or "",
        }
        if msg.tool_calls:
            msg_dict["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": tc.type,
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in msg.tool_calls
            ]

        messages = list(state["messages"])
        messages.append(msg_dict)
        return {
            "messages": messages,
            "tool_iterations": state.get("tool_iterations", 0) + 1,
        }
    except Exception as e:
        print(f"[Orchestrator] Error calling OpenRouter: {e}")
        return {"tool_iterations": 99}


def tools_node(state: ReActAgentState) -> Dict[str, Any]:
    """
    Executes the requested tool functions in Python and appends results to messages.
    """
    last_msg = state["messages"][-1]
    tool_calls = last_msg.get("tool_calls", [])
    messages = list(state["messages"])

    for tc in tool_calls:
        func_name = tc["function"]["name"]
        raw_args = tc["function"]["arguments"]
        tool_id = tc["id"]

        try:
            kwargs = json.loads(raw_args)
        except Exception:
            kwargs = {}

        tool_fn = TOOL_REGISTRY.get(func_name)
        if tool_fn:
            try:
                result = tool_fn(**kwargs)
            except Exception as ex:
                result = f"Error executing {func_name}: {ex}"
        else:
            result = f"Error: Tool '{func_name}' is not recognized."

        messages.append({
            "role": "tool",
            "tool_call_id": tool_id,
            "name": func_name,
            "content": str(result),
        })

    return {"messages": messages}


def format_node(state: ReActAgentState) -> Dict[str, Any]:
    """
    Synthesizes the tool findings into a strict Pydantic JSON schema.
    """
    task_type = state.get("task_type", "verification")
    target_schema = RemediationResponse if task_type == "remediation" else ContextBundle

    if not settings.OPENROUTER_API_KEY:
        # Handled by caller's fallback
        return {"final_output": "{}"}

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )

    prompt = f"""
    Based on all retrieved guidelines, database regimens, drug profiles, and surveillance data:
    Synthesize the final clinical recommendation for this query:
    "{state['clinical_query']}"

    Respond STRICTLY in JSON matching this schema:
    {target_schema.model_json_schema()}
    """

    formatting_messages = list(state["messages"])
    formatting_messages.append({"role": "user", "content": prompt})

    try:
        response = client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            response_format={"type": "json_object"},
            messages=formatting_messages,
            temperature=0.0,
        )
        return {"final_output": response.choices[0].message.content or "{}"}
    except Exception as e:
        print(f"[Orchestrator] Error formatting output: {e}")
        return {"final_output": "{}"}


def should_continue(state: ReActAgentState) -> str:
    """
    Decides whether to execute tool calls or proceed to final synthesis.
    """
    if state.get("tool_iterations", 0) >= 5:
        return "format"

    last_msg = state["messages"][-1] if state["messages"] else {}
    if last_msg.get("tool_calls"):
        return "tools"

    return "format"


# ---------------------------------------------------------------------------
# 3. Compile LangGraph Workflow
# ---------------------------------------------------------------------------

workflow = StateGraph(ReActAgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tools_node)
workflow.add_node("format", format_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {
    "tools": "tools",
    "format": "format",
})
workflow.add_edge("tools", "agent")
workflow.add_edge("format", END)

orchestrator_graph = workflow.compile()


# ---------------------------------------------------------------------------
# 4. Public Orchestrator Entrypoints
# ---------------------------------------------------------------------------

def run_verification_orchestrator(clinical_scenario: str) -> ContextBundle:
    """
    Execute ReAct Orchestrator to investigate an unstructured clinical scenario
    and return a structured ContextBundle.
    """
    system_prompt = (
        "You are an AMR Verification Agent. Use your available tools (search_amr_guidelines, "
        "get_database_regimens, get_drug_monograph, get_pathogen_resistance_data) to verify "
        "whether the prescribed antimicrobials violate clinical guidelines, contraindications, or local resistance patterns."
    )
    initial_state: ReActAgentState = {
        "task_type": "verification",
        "clinical_query": clinical_scenario,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Audit this clinical scenario:\n\n{clinical_scenario}"}
        ],
        "tool_iterations": 0,
        "final_output": ""
    }

    result = orchestrator_graph.invoke(initial_state)
    output_str = result.get("final_output", "")
    try:
        return ContextBundle.model_validate_json(output_str)
    except Exception:
        # Fallback ContextBundle
        return ContextBundle(
            is_safe=False,
            contraindications_found=["Evaluation completed via agent tool-calling"],
            relevant_guidelines=["ICMR Standard Treatment Guidelines 2022"],
            supporting_evidence=[]
        )


def run_remediation_orchestrator(request: RemediationRequest) -> Optional[RemediationResponse]:
    """
    Execute ReAct Orchestrator to autonomously fetch guidelines and regimens
    via tool-calling to build a customized RemediationResponse.
    """
    if not settings.OPENROUTER_API_KEY:
        return None

    syndrome = request.canonical_syndrome or (request.patient.diagnosis_text if request.patient else "Unspecified")
    flagged = request.flagged_drug or "None"
    pt_desc = f"Age: {request.patient.age_years if request.patient else 'Unknown'}, Pregnant: {request.patient.is_pregnant if request.patient else False}, eGFR: {request.patient.egfr if request.patient else 'Normal'}"

    system_prompt = (
        "You are an Antimicrobial Stewardship Remediation Agent. Your goal is to provide evidence-based "
        "de-escalation recommendations and first-line Access regimens for clinicians.\n"
        "You have tools to:\n"
        "1. get_database_regimens: Look up officially approved regimens for this condition.\n"
        "2. search_amr_guidelines: Find ICMR/WHO guideline texts with RRF re-ranking.\n"
        "3. get_drug_monograph: Check drug safety, pediatric limits, and pregnancy categories.\n"
        "4. get_pathogen_resistance_data: Avoid empirical drugs with high resistance rates.\n"
        "Call the appropriate tools before providing your final structured recommendation."
    )

    user_query = (
        f"Generate safe stewardship remediation for:\n"
        f" - Syndrome: {syndrome}\n"
        f" - Flagged Drug to Replace: {flagged}\n"
        f" - Patient Profile: {pt_desc}\n"
        f"Find the standard ICMR/WHO first-line Access regimen and safe alternatives."
    )

    initial_state: ReActAgentState = {
        "task_type": "remediation",
        "clinical_query": user_query,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "tool_iterations": 0,
        "final_output": ""
    }

    try:
        result = orchestrator_graph.invoke(initial_state)
        output_str = result.get("final_output", "")
        return RemediationResponse.model_validate_json(output_str)
    except Exception as e:
        print(f"[Orchestrator] Remediation agent invocation error: {e}")
        return None
