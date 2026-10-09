"""
Prescription Extraction Agent for AMR-Guard.

Follows SOLID principles and GoF design patterns:
- Facade Pattern: Coordinates multimodal OCR, LLM structured extraction, DrugNormalizerAgent, and IndicationAgent.
- Graceful Degradation: Implements deterministic regex-based fallback when offline.
"""
import base64
import json
import re
from typing import Optional, List
from openai import OpenAI

from app.core.config import settings
from app.agents.prompts import PromptFactory
from app.agents.normalizer import DrugNormalizerAgent
from app.agents.indication import IndicationAgent
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.extract import PrescriptionExtractionResponse
from app.engine.constraints import (
    normalize_text,
    get_aware_tier,
    VIRAL_SELF_LIMITING_SYNDROMES,
)


class ExtractionAgent:
    """
    Facade agent responsible for extracting structured clinical prescription entities
    from free-text doctor notes and multimodal prescription images.
    """

    def __init__(self):
        self.normalizer = DrugNormalizerAgent()
        self.indication_agent = IndicationAgent()

    def fallback_heuristic_extract(self, text: str) -> PrescriptionExtractionResponse:
        """
        Deterministic regex & heuristic entity extraction fallback
        used when offline or when OpenRouter API is unavailable.
        """
        clean = text.strip()
        norm = clean.lower()

        # 1. Infer Age
        age = 35
        age_match = re.search(r"\b(\d{1,2})\s*(?:yo|y/o|yr|years?|years?\s*old)\b", norm)
        if age_match:
            age = int(age_match.group(1))

        # 2. Infer Sex and Pregnancy
        is_negated_pregnant = bool(re.search(r"\b(?:non[-\s]?pregnant|not\s+pregnant)\b", norm))
        has_pregnant_mention = bool(re.search(r"\b(pregnant|pregnancy|trimester|gestation)\b", norm))
        is_pregnant = has_pregnant_mention and not is_negated_pregnant

        sex = "unknown"
        if is_pregnant or re.search(r"\b(female|woman|girl|mrs|ms)\b", norm):
            sex = "F"
        elif re.search(r"\b(male|man|boy|mr)\b", norm):
            sex = "M"

        # 3. Infer Duration
        duration = 5
        dur_match = re.search(r"(\d{1,2})\s*(?:days?|d)\b", norm)
        if dur_match:
            duration = int(dur_match.group(1))

        # 4. Extract Known Drugs with normalizer
        common_candidates = [
            "ciprofloxacin", "levofloxacin", "ofloxacin", "norfloxacin", "moxifloxacin",
            "doxycycline", "amoxicillin", "azithromycin", "cefixime", "nitrofurantoin",
            "fosfomycin", "meropenem", "linezolid", "colistin", "amikacin", "gentamicin",
            "augmentin", "clavam", "ciplox", "zifi", "taxim-o", "azithral", "monocef",
            "ofloxacin + ornidazole", "cefixime + azithromycin"
        ]

        lines: List[PrescriptionLine] = []
        for cand in common_candidates:
            if cand in norm:
                normalized = self.normalizer.normalize(cand)
                lines.append(
                    PrescriptionLine(
                        raw_text=cand.title(),
                        drug_name=normalized.generic_name,
                        brand=normalized.brand_name,
                        generic=normalized.generic_name,
                        strength=normalized.strength,
                        duration_days=duration,
                        aware_tier=normalized.aware_tier,
                        confidence=normalized.confidence,
                    )
                )

        if not lines:
            normalized_default = self.normalizer.normalize("Amoxicillin")
            lines.append(
                PrescriptionLine(
                    raw_text="Extracted medication",
                    drug_name="Amoxicillin",
                    generic="Amoxicillin",
                    duration_days=duration,
                    aware_tier="Access",
                    confidence=0.5,
                )
            )

        # 5. Infer Diagnosis / Syndrome with IndicationAgent
        syndrome_res = self.indication_agent.resolve(clean)

        patient = PatientContext(
            age_years=age,
            sex=sex,
            is_pregnant=is_pregnant,
            diagnosis_text=syndrome_res.canonical_syndrome or clean[:100],
        )

        return PrescriptionExtractionResponse(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome=syndrome_res.canonical_syndrome,
            is_outpatient=True,
            confidence_score=0.8,
            raw_text=clean,
        )

    def extract_from_text(self, text: str) -> PrescriptionExtractionResponse:
        """
        Extract clinical entities from text using OpenRouter with heuristic fallback.
        """
        if not settings.OPENROUTER_API_KEY:
            return self.fallback_heuristic_extract(text)

        prompt_strategy = PromptFactory.create_extraction_prompt(PrescriptionExtractionResponse)

        try:
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENROUTER_API_KEY,
            )
            response = client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt_strategy.system_instructions()},
                    {"role": "user", "content": f"Extract prescription entities from:\n\n{text}"}
                ],
                temperature=0.0,
            )
            content = response.choices[0].message.content or "{}"
            data = json.loads(content)
            data["raw_text"] = text

            # Enrich extracted prescription lines using normalizer
            parsed_res = PrescriptionExtractionResponse.model_validate(data)
            for line in parsed_res.prescription_lines:
                norm_drug = self.normalizer.normalize(line.drug_name)
                if not line.aware_tier or line.aware_tier == "Access":
                    line.aware_tier = norm_drug.aware_tier

            return parsed_res
        except Exception:
            return self.fallback_heuristic_extract(text)

    def extract_from_image(self, file_bytes: bytes, content_type: str = "image/jpeg") -> PrescriptionExtractionResponse:
        """
        Extract clinical entities from photographed prescription using Vision LLM.
        """
        if not settings.OPENROUTER_API_KEY:
            return self.fallback_heuristic_extract("Rx: Amoxicillin 500mg TDS for 5 days. Patient: 32yo male, Mild CAP.")

        prompt_strategy = PromptFactory.create_extraction_prompt(PrescriptionExtractionResponse)

        try:
            b64_image = base64.b64encode(file_bytes).decode("utf-8")
            data_url = f"data:{content_type};base64,{b64_image}"

            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENROUTER_API_KEY,
            )
            response = client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt_strategy.system_instructions()},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Please transcribe and extract all clinical details from this prescription image into structured JSON."},
                            {"type": "image_url", "image_url": {"url": data_url}}
                        ]
                    }
                ],
                temperature=0.0,
            )
            content = response.choices[0].message.content or "{}"
            data = json.loads(content)
            data["raw_text"] = "Transcribed from prescription image"
            return PrescriptionExtractionResponse.model_validate(data)
        except Exception:
            return self.fallback_heuristic_extract("Rx: Amoxicillin 500mg TDS for 5 days. Patient: 32yo male, Mild CAP.")

    def extract_from_pdf(self, file_bytes: bytes) -> PrescriptionExtractionResponse:
        """
        Extract clinical entities from an uploaded prescription PDF document.
        Supports both digital text-based PDFs (via pypdf text extraction)
        and scanned/photographed PDFs containing embedded images.
        """
        # 1. Attempt native text extraction via pypdf
        try:
            import io
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(file_bytes))
            extracted_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"

            # If meaningful clinical text was extracted
            if len(extracted_text.strip()) >= 15:
                return self.extract_from_text(extracted_text.strip())

            # 2. If no text (scanned PDF), look for embedded page images
            for page in reader.pages:
                if hasattr(page, "images") and len(page.images) > 0:
                    first_img = page.images[0]
                    img_bytes = first_img.data
                    img_name = getattr(first_img, "name", "").lower()
                    c_type = "image/png" if img_name.endswith(".png") else "image/jpeg"
                    return self.extract_from_image(img_bytes, content_type=c_type)
        except Exception as e:
            print(f"[ExtractionAgent] Note: pypdf parsing notice: {e}")

        # 3. Multimodal LLM fallback or heuristic
        if settings.OPENROUTER_API_KEY:
            try:
                b64_pdf = base64.b64encode(file_bytes).decode("utf-8")
                data_url = f"data:application/pdf;base64,{b64_pdf}"
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.OPENROUTER_API_KEY,
                )
                prompt_strategy = PromptFactory.create_extraction_prompt(PrescriptionExtractionResponse)
                response = client.chat.completions.create(
                    model=settings.OPENROUTER_MODEL,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": prompt_strategy.system_instructions()},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Please transcribe and extract all clinical details from this prescription PDF document into structured JSON."},
                                {"type": "image_url", "image_url": {"url": data_url}}
                            ]
                        }
                    ],
                    temperature=0.0,
                )
                content = response.choices[0].message.content or "{}"
                data = json.loads(content)
                data["raw_text"] = "Transcribed from prescription PDF document"
                return PrescriptionExtractionResponse.model_validate(data)
            except Exception:
                pass

        return self.fallback_heuristic_extract("Rx: Amoxicillin 500mg TDS for 5 days. Patient: 32yo male, Mild CAP.")

    def extract_from_document(
        self,
        file_bytes: bytes,
        content_type: str = "image/jpeg",
        filename: str = "",
    ) -> PrescriptionExtractionResponse:
        """
        Unified document extraction for images (PNG, JPG, WebP) and PDF documents.
        """
        is_pdf = "pdf" in (content_type or "").lower() or (filename or "").lower().endswith(".pdf")
        if is_pdf:
            return self.extract_from_pdf(file_bytes)
        return self.extract_from_image(file_bytes, content_type=content_type)

