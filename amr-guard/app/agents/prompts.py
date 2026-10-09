"""
Clinical Prompt Management System for AMR-Guard.

Follows SOLID principles and GoF design patterns:
- Template Method Pattern: BasePromptStrategy establishes the invariant message assembly flow.
- Strategy Pattern: Task-specific prompt strategies (Verification, Remediation, Synthesis, Extraction, Ingestion).
- Builder Pattern: PromptBuilder for fluent, dynamic composition of clinical context, guidelines, and schemas.
- Factory Pattern: PromptFactory provides a unified creation interface for callers.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Type, Optional
from pydantic import BaseModel


# ===========================================================================
# 1. Base Abstraction (Template Method Pattern)
# ===========================================================================

class BasePromptStrategy(ABC):
    """
    Abstract base strategy defining the template method for LLM message creation.
    Adheres to the Single Responsibility and Open/Closed Principles.
    """

    @abstractmethod
    def system_instructions(self) -> str:
        """Returns the system persona, clinical directives, and constraints."""
        pass

    @abstractmethod
    def user_content(self) -> str:
        """Returns the hydrated user query or scenario payload."""
        pass

    def build_messages(self) -> List[Dict[str, str]]:
        """
        Template method: Assembles the standard chat completion messages list.
        Guarantees uniform formatting across all agent nodes and services.
        """
        messages: List[Dict[str, str]] = []
        sys_inst = self.system_instructions().strip()
        if sys_inst:
            messages.append({"role": "system", "content": sys_inst})

        user_cnt = self.user_content().strip()
        if user_cnt:
            messages.append({"role": "user", "content": user_cnt})

        return messages


# ===========================================================================
# 2. Concrete Strategies (Strategy Pattern)
# ===========================================================================

class VerificationPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for the ReAct AMR Verification Agent.
    Embeds core ICMR/WHO safety guidelines and tool usage directives.
    """

    def __init__(
        self,
        clinical_scenario: str,
        guidelines_context: Optional[List[str]] = None,
        resistance_stats: Optional[Dict[str, Any]] = None,
    ):
        self.clinical_scenario = clinical_scenario
        self.guidelines_context = guidelines_context or []
        self.resistance_stats = resistance_stats or {}

    def system_instructions(self) -> str:
        instructions = (
            "You are an AMR Verification Agent. Use your available tools (search_amr_guidelines, "
            "get_database_regimens, get_drug_monograph, get_pathogen_resistance_data) to verify "
            "whether the prescribed antimicrobials violate clinical guidelines, contraindications, "
            "or local resistance patterns.\n"
            "Authoritative Standards:\n"
            "- ICMR Standard Treatment Guidelines (STG) 2022/2024\n"
            "- WHO AWaRe Classification (Access, Watch, Reserve)\n"
            "- Beers Criteria for Geriatric Renal Safety\n"
            "- DCGI Banned Fixed-Dose Combinations (FDCs)"
        )
        if self.guidelines_context:
            guidelines_text = "\n".join(f"- {g}" for g in self.guidelines_context)
            instructions += f"\n\nPre-retrieved Evidence Guidelines:\n{guidelines_text}"
        if self.resistance_stats:
            stats_text = "\n".join(f"- {k}: {v}" for k, v in self.resistance_stats.items())
            instructions += f"\n\nEpidemiological Resistance Context:\n{stats_text}"
        return instructions

    def user_content(self) -> str:
        return f"Audit this clinical scenario:\n\n{self.clinical_scenario}"


class RemediationPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for Antimicrobial Stewardship Remediation & de-escalation.
    Directs the LLM to propose safer first-line Access alternatives.
    """

    def __init__(
        self,
        syndrome: str,
        flagged_drug: str,
        patient_profile: str,
        guideline_summaries: Optional[List[str]] = None,
    ):
        self.syndrome = syndrome
        self.flagged_drug = flagged_drug
        self.patient_profile = patient_profile
        self.guideline_summaries = guideline_summaries or []

    def system_instructions(self) -> str:
        instructions = (
            "You are an Antimicrobial Stewardship Remediation Agent. Your goal is to provide evidence-based "
            "de-escalation recommendations and first-line Access regimens for clinicians.\n"
            "You have tools to:\n"
            "1. get_database_regimens: Look up officially approved regimens for this condition.\n"
            "2. search_amr_guidelines: Find ICMR/WHO guideline texts with RRF re-ranking.\n"
            "3. get_drug_monograph: Check drug safety, pediatric limits, and pregnancy categories.\n"
            "4. get_pathogen_resistance_data: Avoid empirical drugs with high resistance rates.\n"
            "Call the appropriate tools before providing your final structured recommendation."
        )
        if self.guideline_summaries:
            guides = "\n".join(f"- {g}" for g in self.guideline_summaries)
            instructions += f"\n\nReference Guidelines:\n{guides}"
        return instructions

    def user_content(self) -> str:
        return (
            f"Generate safe stewardship remediation for:\n"
            f" - Syndrome: {self.syndrome}\n"
            f" - Flagged Drug to Replace: {self.flagged_drug}\n"
            f" - Patient Profile: {self.patient_profile}\n"
            f"Find the standard ICMR/WHO first-line Access regimen and safe alternatives."
        )


class SynthesisPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for synthesizing final structured JSON adhering to a target Pydantic schema.
    """

    def __init__(self, clinical_query: str, target_schema: Type[BaseModel]):
        self.clinical_query = clinical_query
        self.target_schema = target_schema

    def system_instructions(self) -> str:
        return (
            "You are an AMR-Guard clinical synthesizer. "
            "Synthesize all retrieved evidence and findings into a single, valid JSON object matching the requested schema."
        )

    def user_content(self) -> str:
        return (
            f"Based on all retrieved guidelines, database regimens, drug profiles, and surveillance data:\n"
            f"Synthesize the final clinical recommendation for this query:\n"
            f'"{self.clinical_query}"\n\n'
            f"Respond STRICTLY in JSON matching this schema:\n"
            f"{self.target_schema.model_json_schema()}"
        )


class ExtractionPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for multimodal Vision OCR and NLP clinical prescription entity extraction.
    Guarantees that the prompt schema stays in lockstep with the Pydantic schema.
    """

    def __init__(self, target_schema: Type[BaseModel]):
        self.target_schema = target_schema

    def system_instructions(self) -> str:
        return (
            "You are an expert clinical pharmacologist and prescription parsing assistant for AMR-Guard.\n"
            "Extract structured clinical entities from the prescription text or image.\n\n"
            "You must respond STRICTLY with a valid JSON object matching this schema:\n"
            f"{self.target_schema.model_json_schema()}"
        )

    def user_content(self) -> str:
        return "Extract prescription entities from the provided context."


class IngestionPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for normalizing messy OKF CSV or Markdown clinical data tables.
    """

    def __init__(self, raw_content: str, data_type: str, target_schema: Type[BaseModel]):
        self.raw_content = raw_content
        self.data_type = data_type
        self.target_schema = target_schema

    def system_instructions(self) -> str:
        return "You are a data extraction assistant. Always output JSON."

    def user_content(self) -> str:
        return (
            f"You are an AMR-Guard data ingestion assistant.\n"
            f"Extract the '{self.data_type}' data from the following OKF-formatted content (could be messy CSV or Markdown).\n"
            f"Return the normalized data strictly as JSON matching the requested schema.\n\n"
            f"Schema:\n{self.target_schema.model_json_schema()}\n\n"
            f"Content:\n{self.raw_content}"
        )


class IndicationPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for resolving free-text clinical diagnoses to ICMR canonical syndrome codes.
    """

    def __init__(self, diagnosis_text: str, candidate_syndromes: Optional[List[str]] = None):
        self.diagnosis_text = diagnosis_text
        self.candidate_syndromes = candidate_syndromes or [
            "SYN_CAP_MILD",
            "SYN_UNCOMPLICATED_UTI",
            "SYN_ACUTE_BRONCHITIS",
            "SYN_COMMON_COLD",
            "SYN_VIRAL_URTI",
            "SYN_PHARYNGITIS_NON_STREP",
            "SYN_WATERY_DIARRHEA",
            "SYN_PHARYNGITIS_STREP",
            "SYN_AOM",
            "SYN_SSTI_UNCOMPLICATED",
        ]

    def system_instructions(self) -> str:
        candidates_str = ", ".join(f'"{c}"' for c in self.candidate_syndromes)
        return (
            "You are an AMR-Guard clinical diagnosis normalization specialist.\n"
            f"Map the given diagnosis text to the single best matching canonical syndrome from this list:\n"
            f"[{candidates_str}]\n\n"
            "If the diagnosis corresponds to a common viral upper respiratory infection (cold, viral cough), choose the appropriate viral syndrome.\n"
            'Respond STRICTLY in JSON format: {"canonical_syndrome": "<CODE_OR_NULL>", "confidence": <0.0-1.0>, "rationale": "<BRIEF_REASON>"}'
        )

    def user_content(self) -> str:
        return f"Clinical Diagnosis:\n{self.diagnosis_text}"


class NormalizerPromptStrategy(BasePromptStrategy):
    """
    Prompt strategy for resolving noisy brand names or abbreviations to canonical generic INN drug names.
    """

    def __init__(self, raw_drug_string: str, reference_generics: Optional[List[str]] = None):
        self.raw_drug_string = raw_drug_string
        self.reference_generics = reference_generics or []

    def system_instructions(self) -> str:
        generics_hint = ""
        if self.reference_generics:
            generics_hint = f"Reference generic antimicrobial list:\n{', '.join(self.reference_generics[:40])}\n\n"

        return (
            "You are an expert clinical pharmacologist for AMR-Guard.\n"
            "Given a raw brand name, abbreviated medicine entry, or composite prescription item, "
            "identify the active generic drug name, its strength, and whether it is a fixed-dose combination (FDC).\n"
            f"{generics_hint}"
            'Respond STRICTLY in JSON format: {"generic_name": "<INN_NAME>", "brand_name": "<BRAND_OR_NULL>", "strength": "<STRENGTH_OR_NULL>", "is_fdc": <true/false>, "confidence": <0.0-1.0>}'
        )

    def user_content(self) -> str:
        return f"Raw Drug Input:\n{self.raw_drug_string}"


# ===========================================================================
# 3. Fluent Builder Pattern (Builder Pattern)
# ===========================================================================

class PromptBuilder:
    """
    Fluent builder for dynamic, step-by-step composition of clinical prompts.
    """

    def __init__(self):
        self._system_directives: List[str] = []
        self._user_context: List[str] = []

    def with_role(self, role_description: str) -> "PromptBuilder":
        """Adds a high-level agent persona or mandate."""
        self._system_directives.append(role_description.strip())
        return self

    def with_guideline_constraints(self, constraints: List[str]) -> "PromptBuilder":
        """Injects clinical guideline constraints (e.g. ICMR STG, WHO AWaRe)."""
        bullet_list = "\n".join(f"- {c}" for c in constraints)
        self._system_directives.append(f"Clinical Constraints & Directives:\n{bullet_list}")
        return self

    def with_schema(self, schema_cls: Type[BaseModel]) -> "PromptBuilder":
        """Appends strict JSON schema adherence instructions."""
        self._system_directives.append(
            f"Respond STRICTLY with a valid JSON object adhering to this schema:\n{schema_cls.model_json_schema()}"
        )
        return self

    def with_query(self, query: str) -> "PromptBuilder":
        """Sets the user clinical scenario or query."""
        self._user_context.append(query.strip())
        return self

    def build(self) -> List[Dict[str, str]]:
        """Assembles the final OpenAI-formatted message list."""
        messages: List[Dict[str, str]] = []
        if self._system_directives:
            messages.append({"role": "system", "content": "\n\n".join(self._system_directives)})
        if self._user_context:
            messages.append({"role": "user", "content": "\n\n".join(self._user_context)})
        return messages


# ===========================================================================
# 4. Prompt Factory (Factory Pattern)
# ===========================================================================

class PromptFactory:
    """
    Factory interface providing pre-configured prompt strategies for the AMR-Guard agents.
    """

    @staticmethod
    def create_verification_prompt(
        scenario: str,
        guidelines_context: Optional[List[str]] = None,
        resistance_stats: Optional[Dict[str, Any]] = None,
    ) -> BasePromptStrategy:
        return VerificationPromptStrategy(
            clinical_scenario=scenario,
            guidelines_context=guidelines_context,
            resistance_stats=resistance_stats,
        )

    @staticmethod
    def create_remediation_prompt(
        syndrome: str,
        flagged_drug: str,
        patient_profile: str,
        guideline_summaries: Optional[List[str]] = None,
    ) -> BasePromptStrategy:
        return RemediationPromptStrategy(
            syndrome=syndrome,
            flagged_drug=flagged_drug,
            patient_profile=patient_profile,
            guideline_summaries=guideline_summaries,
        )

    @staticmethod
    def create_synthesis_prompt(
        clinical_query: str,
        target_schema: Type[BaseModel],
    ) -> BasePromptStrategy:
        return SynthesisPromptStrategy(
            clinical_query=clinical_query,
            target_schema=target_schema,
        )

    @staticmethod
    def create_extraction_prompt(target_schema: Type[BaseModel]) -> BasePromptStrategy:
        return ExtractionPromptStrategy(target_schema=target_schema)

    @staticmethod
    def create_ingestion_prompt(
        raw_content: str,
        data_type: str,
        target_schema: Type[BaseModel],
    ) -> BasePromptStrategy:
        return IngestionPromptStrategy(
            raw_content=raw_content,
            data_type=data_type,
            target_schema=target_schema,
        )

    @staticmethod
    def create_indication_prompt(
        diagnosis_text: str,
        candidate_syndromes: Optional[List[str]] = None,
    ) -> BasePromptStrategy:
        return IndicationPromptStrategy(
            diagnosis_text=diagnosis_text,
            candidate_syndromes=candidate_syndromes,
        )

    @staticmethod
    def create_normalizer_prompt(
        raw_drug_string: str,
        reference_generics: Optional[List[str]] = None,
    ) -> BasePromptStrategy:
        return NormalizerPromptStrategy(
            raw_drug_string=raw_drug_string,
            reference_generics=reference_generics,
        )
