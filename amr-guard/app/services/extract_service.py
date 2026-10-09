"""
Prescription entity extraction service (Text NLP and Multimodal Vision OCR).
Delegates extraction mechanics to ExtractionAgent facade in app.agents.extraction.
"""
from app.schemas.extract import PrescriptionExtractionResponse
from app.agents.prompts import PromptFactory
from app.agents.extraction import ExtractionAgent

# Dynamically generated via PromptFactory to maintain lockstep with PrescriptionExtractionResponse
SYSTEM_EXTRACTION_PROMPT = PromptFactory.create_extraction_prompt(PrescriptionExtractionResponse).system_instructions()

_agent = ExtractionAgent()

def _fallback_heuristic_extract(text: str) -> PrescriptionExtractionResponse:
    """
    Deterministic regex & heuristic entity extraction fallback
    used when offline or when OpenRouter API is unavailable.
    """
    return _agent.fallback_heuristic_extract(text)


def extract_prescription_from_text(text: str) -> PrescriptionExtractionResponse:
    """
    Extract structured prescription entities from unstructured clinical text.
    """
    return _agent.extract_from_text(text)


def extract_prescription_from_image(file_bytes: bytes, content_type: str = "image/jpeg") -> PrescriptionExtractionResponse:
    """
    Extract structured prescription entities from an uploaded prescription image using Vision LLM.
    """
    return _agent.extract_from_image(file_bytes, content_type)
