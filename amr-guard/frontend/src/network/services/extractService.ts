// [SOLID: SRP] Prescription Entity Extraction Service (NLP & Multimodal OCR)
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import { ExtractionResult, SexOption, PregnancyStatusOption, AwareTier } from "@/types/prescription";

export interface BackendPrescriptionExtractResponse {
  patient: {
    age_years: number;
    sex: string;
    is_pregnant: boolean;
    weight_kg?: number | null;
    egfr?: number | null;
    diagnosis_text?: string | null;
  };
  prescription_lines: Array<{
    raw_text?: string;
    drug_name?: string;
    brand?: string;
    generic?: string;
    strength?: string;
    frequency?: string;
    duration_days?: number;
    aware_tier?: string;
    drug_class?: string;
    is_fdc?: boolean;
    confidence?: number;
  }>;
  canonical_syndrome?: string;
  is_outpatient?: boolean;
  confidence_score?: number;
  raw_text?: string;
}

function mapBackendExtractToResult(
  data: BackendPrescriptionExtractResponse,
  fallbackText: string = ""
): ExtractionResult {
  const sexLower = (data.patient?.sex || "").toLowerCase();
  const mappedSex: SexOption = sexLower.startsWith("f")
    ? "Female"
    : sexLower.startsWith("m")
    ? "Male"
    : "Other";

  const mappedPregnancy: PregnancyStatusOption = data.patient?.is_pregnant
    ? "Pregnant"
    : "Not applicable";

  return {
    patient: {
      age: data.patient?.age_years ?? "",
      age_years: data.patient?.age_years,
      sex: mappedSex,
      pregnancyStatus: mappedPregnancy,
      is_pregnant: Boolean(data.patient?.is_pregnant),
      weight_kg: data.patient?.weight_kg ?? undefined,
      egfr: data.patient?.egfr ?? undefined,
      symptoms: data.patient?.diagnosis_text || "",
      suspectedDiagnosis: data.canonical_syndrome || data.patient?.diagnosis_text || "",
      canonical_syndrome: data.canonical_syndrome || undefined,
      is_outpatient: data.is_outpatient ?? true,
    },
    medicines: (data.prescription_lines || []).map((line, idx) => ({
      id: `med-${Date.now()}-${idx + 1}`,
      brandName: line.brand || line.drug_name || "Unspecified",
      genericName: line.generic || line.drug_name || "Unspecified",
      strength: line.strength || "Standard",
      dose: line.strength || "1 unit",
      route: "Oral",
      frequency: line.frequency || "BD",
      duration: line.duration_days ? `${line.duration_days} days` : "5 days",
      duration_days: line.duration_days || 5,
      aware_tier: (line.aware_tier as AwareTier) || "Unclassified",
      drug_class: line.drug_class,
      is_fdc: line.is_fdc ?? false,
      confidence: line.confidence ?? data.confidence_score ?? 0.9,
      verificationStatus: "Needs Verification",
    })),
    rawNotes: data.raw_text || fallbackText,
  };
}

export async function extractFromText(text: string): Promise<ExtractionResult> {
  const response = await apiClient.post<BackendPrescriptionExtractResponse>(
    ENDPOINTS.EXTRACT,
    { text: text.trim() }
  );
  return mapBackendExtractToResult(response.data, text);
}

export async function extractFromImage(file: File): Promise<ExtractionResult> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await apiClient.post<BackendPrescriptionExtractResponse>(
    ENDPOINTS.AUDIT_FROM_IMAGE,
    formData,
    {
      headers: {
        // Will be managed by Axios request interceptor for FormData
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return mapBackendExtractToResult(response.data, `Uploaded slip: ${file.name}`);
}
