// [SOLID: SRP] Clinical Remediation & De-escalation API Service
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import { PatientContext, RemediationOption } from "@/types/prescription";

export interface RemediationResponse {
  canonical_syndrome?: string;
  first_line_access_regimen?: string;
  options: RemediationOption[];
  stewardship_guidance: string;
}

export interface RemediationRequestPayload {
  canonical_syndrome?: string;
  flagged_drug?: string;
  patient?: {
    age_years: number;
    sex: string;
    is_pregnant: boolean;
    weight_kg?: number | null;
    egfr?: number | null;
    diagnosis_text?: string;
  };
}

/**
 * Fetch tailored clinical remediation guidance, first-line Access regimens,
 * and safe de-escalation substitutions from the live backend RAG engine.
 */
export async function fetchRemediationGuidance(params: {
  canonical_syndrome?: string;
  flagged_drug?: string;
  patient?: PatientContext;
}): Promise<RemediationResponse> {
  const payload: RemediationRequestPayload = {
    canonical_syndrome:
      params.canonical_syndrome || params.patient?.canonical_syndrome || params.patient?.suspectedDiagnosis || undefined,
    flagged_drug: params.flagged_drug,
    patient: params.patient
      ? {
          age_years: Number(params.patient.age) || 0,
          sex: params.patient.sex || "unknown",
          is_pregnant: params.patient.pregnancyStatus === "Pregnant",
          weight_kg: params.patient.weight_kg ? Number(params.patient.weight_kg) : null,
          egfr: params.patient.egfr ? Number(params.patient.egfr) : null,
          diagnosis_text: params.patient.symptoms || params.patient.suspectedDiagnosis || "",
        }
      : undefined,
  };

  const response = await apiClient.post<RemediationResponse>(
    ENDPOINTS.REMEDIATE,
    payload
  );
  return response.data;
}
