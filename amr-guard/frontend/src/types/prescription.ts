// [SOLID: SRP] Domain entities and value objects for AMR Sentinel Clinical Intelligence
// Fully aligned with backend FastAPI schemas in app/schemas/

export type SexOption = "Male" | "Female" | "Other" | "Prefer not to specify";

export type PregnancyStatusOption =
  | "Not applicable"
  | "Pregnant"
  | "Not pregnant"
  | "Unknown";

export type AwareTier = "Access" | "Watch" | "Reserve" | "Unclassified";

export type MedicineVerificationStatus =
  | "Verified"
  | "Needs Verification"
  | "Missing";

export type PrescriptionWorkflowStatus =
  | "Draft"
  | "Extraction Complete"
  | "Needs Verification"
  | "Ready for Audit"
  | "Audited";

export type AuditTriageBand = "GREEN" | "AMBER" | "RED";
export type AuditStatus = "APPROVED" | "FLAGGED" | "BLOCKED" | "OVERRIDDEN";
export type RuleSeverity = "BLOCKED" | "HIGH" | "MEDIUM" | "LOW";

export interface ClinicalOverride {
  rationale: string;
  doctorName: string;
  timestamp: string;
  retainedDrug?: string;
}

export interface PatientContext {
  caseId: string;
  patientName?: string;
  age: number | "";
  age_years?: number;
  sex: SexOption;
  pregnancyStatus: PregnancyStatusOption;
  is_pregnant?: boolean;
  weight_kg?: number | "";
  egfr?: number | "";
  allergies: string;
  symptoms: string;
  medicalHistory: string;
  suspectedDiagnosis: string;
  canonical_syndrome?: string;
  has_culture_report?: boolean;
  has_positive_microbiology?: boolean;
  is_outpatient?: boolean;
}

export interface MedicineEntry {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  duration_days?: number;
  aware_tier?: AwareTier;
  drug_class?: string;
  is_fdc?: boolean;
  confidence?: number;
  verificationStatus: MedicineVerificationStatus;
}

export interface RuleViolation {
  tier: number;
  rule_id: string;
  rule_name: string;
  severity: RuleSeverity;
  drug?: string;
  penalty_type?: "contraindication" | "indication" | "class" | "duration" | "resistance" | "fdc" | string;
  penalty_score: number;
  rationale: string;
  remediation?: string;
  citation?: string;
}

export interface PenaltiesBreakdown {
  p_class: number;
  p_duration: number;
  p_indication: number;
}

export interface RemediationOption {
  recommendation_type:
    | "SWITCH_DRUG"
    | "DISCONTINUE"
    | "REDUCE_DURATION"
    | "MANDATE_SYMPTOMATIC"
    | "MICROBIOLOGY_REQUIRED"
    | "CONTRAINDICATION_BLOCK"
    | string;
  suggested_drug?: string;
  suggested_duration_days?: number;
  guidance: string;
  source_citation?: string;
}

export interface AuditResult {
  status: AuditStatus;
  score: number;
  band: AuditTriageBand;
  penalties: PenaltiesBreakdown;
  flags: RuleViolation[];
  remediation_options: RemediationOption[];
  latency_ms: number;
  timestamp?: string;
}

export interface PrescriptionCase {
  id: string;
  sourceType: "upload" | "manual";
  sourceText: string;
  imagePreviewUrl?: string;
  imageFileName?: string;
  patient: PatientContext;
  medicines: MedicineEntry[];
  workflowStatus: PrescriptionWorkflowStatus;
  auditResult?: AuditResult;
  clinicalOverride?: ClinicalOverride;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionResult {
  patient: Partial<PatientContext>;
  medicines: MedicineEntry[];
  rawNotes?: string;
}

export interface BackendAWaReDistribution {
  access_pct: number;
  watch_pct: number;
  reserve_pct: number;
  who_target_met: boolean;
}

export interface BackendTopViolation {
  rule_id: string;
  rule_name: string;
  count: number;
  percentage: number;
}

export interface DashboardMetrics {
  prescriptionsProcessed: number;
  awaitingVerification: number;
  auditsReady: number;
  averageProcessingTimeMinutes: number;
  criticalBlockedCases?: number;
  stewardshipComplianceRate?: number;
  awareDistribution?: BackendAWaReDistribution;
  topViolations?: BackendTopViolation[];
}


