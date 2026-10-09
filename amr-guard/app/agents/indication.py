"""
Clinical Indication & Syndrome Resolution Agent for AMR-Guard.

Follows SOLID principles and GoF design patterns:
- Chain of Responsibility: Fast Lexical Matching -> RapidFuzz Token Scoring -> Stochastic LLM Resolution.
- High Cohesion: Maps clinical diagnosis strings into ICMR canonical syndrome codes and viral flags.
"""
import json
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from rapidfuzz import fuzz, process
from openai import OpenAI

from app.core.config import settings
from app.agents.prompts import PromptFactory
from app.engine.constraints import (
    normalize_text,
    VIRAL_SELF_LIMITING_SYNDROMES,
)

# ---------------------------------------------------------------------------
# ICMR Canonical Syndromes & Display Registry
# ---------------------------------------------------------------------------
CANONICAL_SYNDROMES: Dict[str, Dict[str, Any]] = {
    "SYN_CAP_MILD": {
        "display_name": "Community-Acquired Pneumonia (Mild Outpatient)",
        "keywords": ["pneumonia", "cap", "chest infection", "productive cough", "lung consolidation"],
        "is_viral": False,
    },
    "SYN_UNCOMPLICATED_UTI": {
        "display_name": "Uncomplicated Acute Cystitis / Lower UTI",
        "keywords": ["uti", "cystitis", "burning micturition", "dysuria", "urinary tract infection", "urine urgency"],
        "is_viral": False,
    },
    "SYN_ACUTE_BRONCHITIS": {
        "display_name": "Acute Bronchitis (Self-Limiting Viral)",
        "keywords": ["bronchitis", "acute bronchitis", "chest cold", "wheeze with cough"],
        "is_viral": True,
    },
    "SYN_COMMON_COLD": {
        "display_name": "Common Cold / Rhinopharyngitis (Viral)",
        "keywords": ["cold", "common cold", "rhinorrhea", "coryza", "runny nose", "sneezing", "nasal congestion"],
        "is_viral": True,
    },
    "SYN_VIRAL_URTI": {
        "display_name": "Viral Upper Respiratory Tract Infection",
        "keywords": ["urti", "viral urti", "upper respiratory", "viral infection", "flu", "influenza", "viral fever"],
        "is_viral": True,
    },
    "SYN_PHARYNGITIS_NON_STREP": {
        "display_name": "Non-Streptococcal Pharyngitis (Viral Sore Throat)",
        "keywords": ["sore throat", "pharyngitis", "throat pain", "viral pharyngitis", "tonsillitis non strep"],
        "is_viral": True,
    },
    "SYN_WATERY_DIARRHEA": {
        "display_name": "Acute Watery Diarrhea (Non-Cholera)",
        "keywords": ["diarrhea", "diarrhoea", "loose stools", "gastroenteritis", "loose motions", "acute watery diarrhea"],
        "is_viral": True,
    },
    "SYN_PHARYNGITIS_STREP": {
        "display_name": "Streptococcal Pharyngitis (Group A Strep)",
        "keywords": ["strep throat", "streptococcal pharyngitis", "bacterial pharyngitis"],
        "is_viral": False,
    },
    "SYN_AOM": {
        "display_name": "Acute Otitis Media",
        "keywords": ["otitis media", "aom", "ear infection", "ear pain", "acute otitis"],
        "is_viral": False,
    },
    "SYN_SSTI_UNCOMPLICATED": {
        "display_name": "Uncomplicated Skin and Soft Tissue Infection",
        "keywords": ["cellulitis", "boil", "abscess", "ssti", "skin infection", "furuncle", "impetigo"],
        "is_viral": False,
    },
}


class SyndromeResolutionResult(BaseModel):
    """Structured resolution output for a clinical diagnosis."""
    raw_text: str
    canonical_syndrome: Optional[str] = None
    display_name: str = "Unspecified Diagnosis"
    is_viral_self_limiting: bool = False
    confidence: float = 1.0
    source: str = "deterministic"


class IndicationAgent:
    """
    Resolves clinical free-text indications into ICMR canonical syndrome codes.
    Uses multi-stage Chain of Responsibility:
    1. Canonical Code Check
    2. Clinical Keyword / Semantic Dictionary Match
    3. RapidFuzz Token Match against display titles
    4. Stochastic LLM Fallback (when online)
    """

    def __init__(self, fuzzy_threshold: float = 75.0):
        self.fuzzy_threshold = fuzzy_threshold

    def resolve(self, diagnosis_text: Optional[str]) -> SyndromeResolutionResult:
        """Resolve free-text diagnosis into canonical syndrome result."""
        if not diagnosis_text:
            return SyndromeResolutionResult(
                raw_text="",
                canonical_syndrome=None,
                display_name="Unspecified Diagnosis",
                is_viral_self_limiting=False,
                confidence=0.0,
                source="default",
            )

        norm = normalize_text(diagnosis_text)

        # 1. Direct Canonical Code Match
        norm_upper = diagnosis_text.strip().upper()
        if norm_upper in CANONICAL_SYNDROMES:
            info = CANONICAL_SYNDROMES[norm_upper]
            return SyndromeResolutionResult(
                raw_text=diagnosis_text,
                canonical_syndrome=norm_upper,
                display_name=info["display_name"],
                is_viral_self_limiting=info["is_viral"],
                confidence=1.0,
                source="exact_code",
            )

        # 2. Keyword & Substring Matching
        for syn_code, info in CANONICAL_SYNDROMES.items():
            for kw in info["keywords"]:
                if kw in norm:
                    return SyndromeResolutionResult(
                        raw_text=diagnosis_text,
                        canonical_syndrome=syn_code,
                        display_name=info["display_name"],
                        is_viral_self_limiting=info["is_viral"],
                        confidence=0.92,
                        source="keyword_lexical",
                    )

        # 3. RapidFuzz against display names
        display_map = {info["display_name"]: code for code, info in CANONICAL_SYNDROMES.items()}
        best_match: Optional[Tuple[str, float]] = process.extractOne(
            norm,
            list(display_map.keys()),
            scorer=fuzz.token_set_ratio,
        )

        if best_match and best_match[1] >= self.fuzzy_threshold:
            matched_display = best_match[0]
            matched_code = display_map[matched_display]
            info = CANONICAL_SYNDROMES[matched_code]
            return SyndromeResolutionResult(
                raw_text=diagnosis_text,
                canonical_syndrome=matched_code,
                display_name=info["display_name"],
                is_viral_self_limiting=info["is_viral"],
                confidence=round(best_match[1] / 100.0, 2),
                source="rapidfuzz_semantic",
            )

        # 4. Stochastic LLM Fallback (if online)
        if settings.OPENROUTER_API_KEY:
            try:
                llm_res = self._llm_resolve(diagnosis_text)
                if llm_res:
                    return llm_res
            except Exception:
                pass

        # 5. Default Fallback
        is_viral = any(v in norm for v in VIRAL_SELF_LIMITING_SYNDROMES)
        return SyndromeResolutionResult(
            raw_text=diagnosis_text,
            canonical_syndrome=None,
            display_name=diagnosis_text.strip()[:100],
            is_viral_self_limiting=is_viral,
            confidence=0.4,
            source="fallback",
        )

    def _llm_resolve(self, diagnosis_text: str) -> Optional[SyndromeResolutionResult]:
        """Calls OpenRouter LLM using IndicationPromptStrategy."""
        prompt_strategy = PromptFactory.create_indication_prompt(
            diagnosis_text=diagnosis_text,
            candidate_syndromes=list(CANONICAL_SYNDROMES.keys()),
        )
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        response = client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            response_format={"type": "json_object"},
            messages=prompt_strategy.build_messages(),
            temperature=0.0,
        )
        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        matched_code = data.get("canonical_syndrome")

        if matched_code and matched_code in CANONICAL_SYNDROMES:
            info = CANONICAL_SYNDROMES[matched_code]
            return SyndromeResolutionResult(
                raw_text=diagnosis_text,
                canonical_syndrome=matched_code,
                display_name=info["display_name"],
                is_viral_self_limiting=info["is_viral"],
                confidence=float(data.get("confidence", 0.85)),
                source="openrouter_llm",
            )
        return None
