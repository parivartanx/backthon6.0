"""
Drug Normalizer Agent for AMR-Guard.

Follows SOLID principles and GoF design patterns:
- Chain of Responsibility Pattern: Sequentially executes Clean -> Exact Match -> RapidFuzz Match -> LLM Fallback.
- Strategy Pattern: Configurable normalization strategies for deterministic and stochastic resolution.
- High Cohesion: Resolves brand names, abbreviations, and misspellings to canonical INN generics and WHO AWaRe tiers.
"""
import re
import json
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from rapidfuzz import fuzz, process
from openai import OpenAI

from app.core.config import settings
from app.agents.prompts import PromptFactory
from app.engine.constraints import (
    normalize_text,
    get_aware_tier,
    is_fluoroquinolone,
    is_tetracycline,
    is_aminoglycoside,
    is_irrational_fdc,
    AWARE_ACCESS_DRUGS,
    AWARE_WATCH_DRUGS,
    AWARE_RESERVE_DRUGS,
)

# ---------------------------------------------------------------------------
# Common Indian Clinical Brands to Canonical INN Generics
# ---------------------------------------------------------------------------
COMMON_BRAND_CATALOG: Dict[str, Dict[str, Any]] = {
    "augmentin": {"generic": "Amoxicillin-Clavulanate", "strength": "625mg", "is_fdc": True},
    "clavam": {"generic": "Amoxicillin-Clavulanate", "strength": "625mg", "is_fdc": True},
    "moxikind-cv": {"generic": "Amoxicillin-Clavulanate", "strength": "625mg", "is_fdc": True},
    "amoxyclav": {"generic": "Amoxicillin-Clavulanate", "strength": "625mg", "is_fdc": True},
    "megaclav": {"generic": "Amoxicillin-Clavulanate", "strength": "625mg", "is_fdc": True},
    "ciplox": {"generic": "Ciprofloxacin", "strength": "500mg", "is_fdc": False},
    "cifran": {"generic": "Ciprofloxacin", "strength": "500mg", "is_fdc": False},
    "alcipro": {"generic": "Ciprofloxacin", "strength": "500mg", "is_fdc": False},
    "zifi": {"generic": "Cefixime", "strength": "200mg", "is_fdc": False},
    "taxim-o": {"generic": "Cefixime", "strength": "200mg", "is_fdc": False},
    "mahacef": {"generic": "Cefixime", "strength": "200mg", "is_fdc": False},
    "cefolac": {"generic": "Cefixime", "strength": "200mg", "is_fdc": False},
    "omnicef-o": {"generic": "Cefixime", "strength": "200mg", "is_fdc": False},
    "azithral": {"generic": "Azithromycin", "strength": "500mg", "is_fdc": False},
    "azee": {"generic": "Azithromycin", "strength": "500mg", "is_fdc": False},
    "zady": {"generic": "Azithromycin", "strength": "500mg", "is_fdc": False},
    "azibact": {"generic": "Azithromycin", "strength": "500mg", "is_fdc": False},
    "laz": {"generic": "Azithromycin", "strength": "500mg", "is_fdc": False},
    "oflox": {"generic": "Ofloxacin", "strength": "200mg", "is_fdc": False},
    "zanocin": {"generic": "Ofloxacin", "strength": "200mg", "is_fdc": False},
    "zenflox": {"generic": "Ofloxacin", "strength": "200mg", "is_fdc": False},
    "norflox": {"generic": "Norfloxacin", "strength": "400mg", "is_fdc": False},
    "norbactin": {"generic": "Norfloxacin", "strength": "400mg", "is_fdc": False},
    "levomac": {"generic": "Levofloxacin", "strength": "500mg", "is_fdc": False},
    "l-cin": {"generic": "Levofloxacin", "strength": "500mg", "is_fdc": False},
    "glevo": {"generic": "Levofloxacin", "strength": "500mg", "is_fdc": False},
    "monocef": {"generic": "Ceftriaxone", "strength": "1g", "is_fdc": False},
    "c-tri": {"generic": "Ceftriaxone", "strength": "1g", "is_fdc": False},
    "xone": {"generic": "Ceftriaxone", "strength": "1g", "is_fdc": False},
    "doxicip": {"generic": "Doxycycline", "strength": "100mg", "is_fdc": False},
    "doxy-1": {"generic": "Doxycycline", "strength": "100mg", "is_fdc": False},
    "microdox": {"generic": "Doxycycline", "strength": "100mg", "is_fdc": False},
    "niftas": {"generic": "Nitrofurantoin", "strength": "100mg", "is_fdc": False},
    "martifur": {"generic": "Nitrofurantoin", "strength": "100mg", "is_fdc": False},
    "urifast": {"generic": "Nitrofurantoin", "strength": "100mg", "is_fdc": False},
    "monurol": {"generic": "Fosfomycin", "strength": "3g", "is_fdc": False},
    "fosfocil": {"generic": "Fosfomycin", "strength": "3g", "is_fdc": False},
    "phexin": {"generic": "Cefalexin", "strength": "500mg", "is_fdc": False},
    "sporidex": {"generic": "Cefalexin", "strength": "500mg", "is_fdc": False},
    "ceff": {"generic": "Cefalexin", "strength": "500mg", "is_fdc": False},
    "droxyl": {"generic": "Cefadroxil", "strength": "500mg", "is_fdc": False},
    "ceftum": {"generic": "Cefuroxime Axetil", "strength": "500mg", "is_fdc": False},
    "cetil": {"generic": "Cefuroxime Axetil", "strength": "500mg", "is_fdc": False},
    "gudcef": {"generic": "Cefpodoxime", "strength": "200mg", "is_fdc": False},
    "doxcef": {"generic": "Cefpodoxime", "strength": "200mg", "is_fdc": False},
    "macpod": {"generic": "Cefpodoxime", "strength": "200mg", "is_fdc": False},
    "magnex": {"generic": "Cefoperazone-Sulbactam", "strength": "1.5g", "is_fdc": True},
    "sulbacef": {"generic": "Cefoperazone-Sulbactam", "strength": "1.5g", "is_fdc": True},
    "pipzo": {"generic": "Piperacillin-Tazobactam", "strength": "4.5g", "is_fdc": True},
    "tazact": {"generic": "Piperacillin-Tazobactam", "strength": "4.5g", "is_fdc": True},
    "meronem": {"generic": "Meropenem", "strength": "1g", "is_fdc": False},
    "meromac": {"generic": "Meropenem", "strength": "1g", "is_fdc": False},
    "zyvox": {"generic": "Linezolid", "strength": "600mg", "is_fdc": False},
    "lizomac": {"generic": "Linezolid", "strength": "600mg", "is_fdc": False},
    "linospan": {"generic": "Linezolid", "strength": "600mg", "is_fdc": False},
    "vancocin": {"generic": "Vancomycin", "strength": "1g", "is_fdc": False},
    "vanlid": {"generic": "Vancomycin", "strength": "500mg", "is_fdc": False},
    "xylistin": {"generic": "Colistin", "strength": "1 MIU", "is_fdc": False},
    "tygacil": {"generic": "Tigecycline", "strength": "50mg", "is_fdc": False},
    "zavicefta": {"generic": "Ceftazidime-Avibactam", "strength": "2.5g", "is_fdc": True},
    "bactrim": {"generic": "Co-trimoxazole", "strength": "480mg", "is_fdc": True},
    "septran": {"generic": "Co-trimoxazole", "strength": "480mg", "is_fdc": True},
    "flagyl": {"generic": "Metronidazole", "strength": "400mg", "is_fdc": False},
    "metrogyl": {"generic": "Metronidazole", "strength": "400mg", "is_fdc": False},
    "dalacin-c": {"generic": "Clindamycin", "strength": "300mg", "is_fdc": False},
    "dolo": {"generic": "Paracetamol", "strength": "650mg", "is_fdc": False},
    "calpol": {"generic": "Paracetamol", "strength": "650mg", "is_fdc": False},
    "crocin": {"generic": "Paracetamol", "strength": "650mg", "is_fdc": False},
    "cetzine": {"generic": "Cetirizine", "strength": "10mg", "is_fdc": False},
    "alerid": {"generic": "Cetirizine", "strength": "10mg", "is_fdc": False},
    "1-al": {"generic": "Levocetirizine", "strength": "5mg", "is_fdc": False},
    "electral": {"generic": "Oral Rehydration Salts (ORS) + Zinc", "strength": "21.8g", "is_fdc": True},
    "combiflam": {"generic": "Ibuprofen", "strength": "400mg", "is_fdc": True},
    "norflox-tz": {"generic": "Norfloxacin + Tinidazole", "strength": "400mg/600mg", "is_fdc": True},
    "oflox-oz": {"generic": "Ofloxacin + Ornidazole", "strength": "200mg/500mg", "is_fdc": True},
    "zenflox-oz": {"generic": "Ofloxacin + Ornidazole", "strength": "200mg/500mg", "is_fdc": True},
    "mahacef-az": {"generic": "Cefixime + Azithromycin", "strength": "200mg/250mg", "is_fdc": True},
}



class NormalizedDrug(BaseModel):
    """Structured normalization result for an antimicrobial entity."""
    raw_name: str
    generic_name: str
    brand_name: Optional[str] = None
    strength: Optional[str] = None
    aware_tier: str = "Access"
    is_antibiotic: bool = True
    is_fdc: bool = False
    confidence: float = 1.0


class DrugNormalizerAgent:
    """
    Normalizes clinical drug representations through a multi-stage Chain of Responsibility:
    1. Lexical Pre-processing & Strength Extraction
    2. Brand Catalog Lookup
    3. RapidFuzz String & Token Matching against Known Ontologies
    4. Stochastic LLM Fallback (when API key available)
    """

    def __init__(self, fuzzy_threshold: float = 80.0):
        self.fuzzy_threshold = fuzzy_threshold
        self._all_known_generics: List[str] = sorted(
            list(AWARE_ACCESS_DRUGS | AWARE_WATCH_DRUGS | AWARE_RESERVE_DRUGS)
        )

    def extract_strength(self, text: str) -> Optional[str]:
        """Extract dosage strengths like 500mg, 1g, 625 mg, 100mcg."""
        match = re.search(r"(\d+(?:\.\d+)?\s*(?:mg|g|mcg|iu|ml))", text, re.IGNORECASE)
        return match.group(1).replace(" ", "") if match else None

    def clean_drug_name(self, text: str) -> str:
        """Strip dosages, tablet/capsule suffixes, and punctuation."""
        cleaned = re.sub(r"\b(tab|tablets?|cap|capsules?|inj|injection|syp|syrup|oral|suspension)\b", "", text, flags=re.IGNORECASE)
        cleaned = re.sub(r"\d+(?:\.\d+)?\s*(?:mg|g|mcg|iu|ml)", "", cleaned, flags=re.IGNORECASE)
        return normalize_text(cleaned)

    def normalize(self, raw_input: str) -> NormalizedDrug:
        """
        Main pipeline: Cleans and resolves a drug string into a NormalizedDrug.
        """
        raw_clean = normalize_text(raw_input)
        if not raw_clean:
            return NormalizedDrug(
                raw_name="",
                generic_name="Unknown",
                aware_tier="Access",
                is_antibiotic=False,
                confidence=0.0,
            )

        extracted_strength = self.extract_strength(raw_input)
        cleaned_base = self.clean_drug_name(raw_input)

        # 1. Direct Brand Match
        if cleaned_base in COMMON_BRAND_CATALOG:
            brand_info = COMMON_BRAND_CATALOG[cleaned_base]
            generic = brand_info["generic"]
            return NormalizedDrug(
                raw_name=raw_input,
                generic_name=generic,
                brand_name=cleaned_base.title(),
                strength=extracted_strength or brand_info.get("strength"),
                aware_tier=get_aware_tier(generic),
                is_antibiotic=True,
                is_fdc=brand_info.get("is_fdc", False),
                confidence=0.98,
            )

        # 2. Exact Generic Match
        for generic in self._all_known_generics:
            if generic == cleaned_base or generic in cleaned_base:
                return NormalizedDrug(
                    raw_name=raw_input,
                    generic_name=generic.title(),
                    strength=extracted_strength,
                    aware_tier=get_aware_tier(generic),
                    is_antibiotic=True,
                    is_fdc=is_irrational_fdc(raw_input),
                    confidence=0.95,
                )

        # 3. RapidFuzz against Brands Catalog
        best_brand_match: Optional[Tuple[str, float]] = process.extractOne(
            cleaned_base,
            list(COMMON_BRAND_CATALOG.keys()),
            scorer=fuzz.token_set_ratio,
        )
        if best_brand_match and best_brand_match[1] >= self.fuzzy_threshold:
            matched_brand = best_brand_match[0]
            brand_info = COMMON_BRAND_CATALOG[matched_brand]
            generic = brand_info["generic"]
            return NormalizedDrug(
                raw_name=raw_input,
                generic_name=generic,
                brand_name=matched_brand.title(),
                strength=extracted_strength or brand_info.get("strength"),
                aware_tier=get_aware_tier(generic),
                is_antibiotic=True,
                is_fdc=brand_info.get("is_fdc", False),
                confidence=round(best_brand_match[1] / 100.0, 2),
            )

        # 4. RapidFuzz against Known Generics
        best_generic_match: Optional[Tuple[str, float]] = process.extractOne(
            cleaned_base,
            self._all_known_generics,
            scorer=fuzz.token_set_ratio,
        )
        if best_generic_match and best_generic_match[1] >= self.fuzzy_threshold:
            matched_generic = best_generic_match[0]
            return NormalizedDrug(
                raw_name=raw_input,
                generic_name=matched_generic.title(),
                strength=extracted_strength,
                aware_tier=get_aware_tier(matched_generic),
                is_antibiotic=True,
                is_fdc=is_irrational_fdc(matched_generic),
                confidence=round(best_generic_match[1] / 100.0, 2),
            )

        # 5. Stochastic LLM Fallback (if online)
        if settings.OPENROUTER_API_KEY:
            try:
                llm_result = self._llm_normalize(raw_input)
                if llm_result:
                    return llm_result
            except Exception:
                pass

        # 6. Fallback Generic Return
        return NormalizedDrug(
            raw_name=raw_input,
            generic_name=cleaned_base.title() or raw_input.strip(),
            strength=extracted_strength,
            aware_tier=get_aware_tier(cleaned_base),
            is_antibiotic=True,
            is_fdc=is_irrational_fdc(raw_input),
            confidence=0.5,
        )

    def _llm_normalize(self, raw_input: str) -> Optional[NormalizedDrug]:
        """Calls OpenRouter LLM using NormalizerPromptStrategy."""
        prompt_strategy = PromptFactory.create_normalizer_prompt(
            raw_drug_string=raw_input,
            reference_generics=self._all_known_generics[:30],
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
        generic = data.get("generic_name")
        if not generic:
            return None

        return NormalizedDrug(
            raw_name=raw_input,
            generic_name=generic,
            brand_name=data.get("brand_name"),
            strength=data.get("strength") or self.extract_strength(raw_input),
            aware_tier=get_aware_tier(generic),
            is_antibiotic=True,
            is_fdc=bool(data.get("is_fdc", False)),
            confidence=float(data.get("confidence", 0.8)),
        )
