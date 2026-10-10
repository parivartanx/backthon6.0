// [SOLID: SRP & Resilience] Five-Tier Verification Audit Service with Seamless Engine Fallback
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import { PrescriptionCase, AuditResult } from "@/types/prescription";
import { auditPrescription as localAuditPrescription } from "@/lib/api";

function parseDurationDays(durationText?: string): number {
  if (!durationText) return 5;
  const lower = durationText.toLowerCase();
  const match = lower.match(/(\d+)/);
  if (!match) return 5;
  const num = parseInt(match[1], 10);
  if (lower.includes("week") || lower.includes("wk")) return num * 7;
  if (lower.includes("month") || lower.includes("mo")) return num * 30;
  return num;
}

export async function submitPrescriptionAudit(
  caseData: PrescriptionCase
): Promise<AuditResult> {
  const payload = {
    patient: {
      age_years: Number(caseData.patient.age) || 0,
      sex: caseData.patient.sex || "unknown",
      is_pregnant: caseData.patient.pregnancyStatus === "Pregnant",
      weight_kg: caseData.patient.weight_kg ? Number(caseData.patient.weight_kg) : null,
      egfr: caseData.patient.egfr ? Number(caseData.patient.egfr) : null,
      allergies: caseData.patient.allergies || "NKDA",
      medical_history: caseData.patient.medicalHistory || null,
      diagnosis_text:
        caseData.patient.symptoms || caseData.patient.suspectedDiagnosis || "",
    },
    prescription_lines: caseData.medicines.map((m) => ({
      raw_text: `${m.brandName} ${m.genericName} ${m.strength} ${m.frequency} x ${m.duration}`,
      drug_name: m.genericName || m.brandName,
      brand: m.brandName,
      generic: m.genericName,
      strength: m.strength,
      frequency: m.frequency,
      duration_days: parseDurationDays(m.duration),
      aware_tier: m.aware_tier || "Access",
      drug_class: m.drug_class || "General Antimicrobial",
      is_fdc: Boolean(m.is_fdc),
    })),
    canonical_syndrome:
      caseData.patient.canonical_syndrome ||
      caseData.patient.suspectedDiagnosis ||
      null,
    has_culture_report: Boolean(caseData.patient.has_culture_report),
    has_positive_microbiology: Boolean(caseData.patient.has_positive_microbiology),
    is_outpatient: caseData.patient.is_outpatient ?? true,
  };

  try {
    const response = await apiClient.post<AuditResult>(ENDPOINTS.AUDIT, payload);
    if (response.data && typeof response.data.score === "number") {
      return response.data;
    }
  } catch (networkError) {
    console.warn(
      "Live API audit endpoint unavailable or offline. Falling back to deterministic rule engine:",
      networkError
    );
  }

  // Seamless fallback to deterministic 5-Tier Rule Engine
  return await localAuditPrescription(caseData);
}
