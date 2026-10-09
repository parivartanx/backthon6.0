# System Architecture Overview

For a detailed breakdown of the complete end-to-end technology stack, see [Technology Stack Specification](file:///d:/Web%20Project/AMR/amr-guard/docs/tech-stack.md).

For the clinical rules specification, penalty formulas, and evidence citations, see [Five-Tier Verification Pipeline Specification](file:///d:/Web%20Project/AMR/amr-guard/docs/rules-spec.md).

---

## High-Level Architectural Pattern

AMR-Guard is designed around the **"Stochastic Edge, Deterministic Core"** architectural pattern:

1. **Stochastic Edge (LLMs & RAG):**
   - Natural language extraction, normalization, and semantic literature search.
   - Built with **LangGraph**, **OpenRouter**, **Google Gemini**, and **LlamaIndex** with **pgvector**.
2. **Deterministic Core (Clinical Rule Engine):**
   - Mathematical penalty scoring and hard contraindication gates.
   - Pure Python implementation without external AI or network dependencies.
3. **Monolith Deployment:**
   - Single-server hosting where **FastAPI** serves both `/api/v1/*` endpoints and the static export of the **Next.js 16** frontend.
