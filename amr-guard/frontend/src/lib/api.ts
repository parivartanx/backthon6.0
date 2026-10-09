// [SOLID: DIP & OCP] Unified API client with automatic backend delegation and deterministic client fallback
import { 
  PrescriptionCase, 
  DashboardMetrics, 
  ExtractionResult, 
  AuditResult, 
  RuleViolation, 
  RemediationOption, 
  PenaltiesBreakdown 
} from "@/types/prescription";
import { prescriptionStore } from "./prescriptionStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Standard fetch helper with error handling
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Service API methods for Prescriptions
 */
export async function getPrescriptions(): Promise<PrescriptionCase[]> {
  try {
    return await fetchApi<PrescriptionCase[]>("/prescriptions");
  } catch {
    // Graceful fallback to client store when backend service is offline
    return prescriptionStore.getAll();
  }
}

export async function getPrescriptionById(id: string): Promise<PrescriptionCase | null> {
  try {
    return await fetchApi<PrescriptionCase>(`/prescriptions/${id}`);
  } catch {
    return prescriptionStore.getById(id);
  }
}

export async function savePrescription(caseData: PrescriptionCase): Promise<PrescriptionCase> {
  try {
    return await fetchApi<PrescriptionCase>(`/prescriptions/${caseData.id}`, {
      method: "PUT",
      body: JSON.stringify(caseData),
    });
  } catch {
    return prescriptionStore.save(caseData);
  }
}

interface BackendPrescriptionResponse {
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

interface BackendStatsResponse {
  total_audits: number;
  blocked_count: number;
  flagged_count: number;
  approved_count: number;
  adherence_rate_pct: number;
  average_risk_score: number;
  aware_distribution: {
    access_pct: number;
    watch_pct: number;
    reserve_pct: number;
    who_target_met: boolean;
  };
  top_violations: Array<{
    rule_id: string;
    rule_name: string;
    count: number;
    percentage: number;
  }>;
}

export async function extractPrescription(input: {
  sourceType: "upload" | "manual";
  text?: string;
  file?: File;
}): Promise<ExtractionResult> {
  try {
    const textToSend = input.text?.trim() || "";
    if (!textToSend) {
      return await prescriptionStore.extractPrescription(input);
    }

    const data = await fetchApi<BackendPrescriptionResponse>("/extract/", {
      method: "POST",
      body: JSON.stringify({ text: textToSend }),
    });

    const sexLower = (data.patient?.sex || "").toLowerCase();
    const mappedSex = sexLower.startsWith("f")
      ? "Female"
      : sexLower.startsWith("m")
      ? "Male"
      : "Other";

    return {
      patient: {
        age: data.patient?.age_years ?? "",
        age_years: data.patient?.age_years,
        sex: mappedSex,
        pregnancyStatus: data.patient?.is_pregnant ? "Pregnant" : "Not applicable",
        is_pregnant: data.patient?.is_pregnant,
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
        aware_tier: (line.aware_tier as any) || "Unclassified",
        drug_class: line.drug_class,
        is_fdc: line.is_fdc ?? false,
        confidence: line.confidence ?? data.confidence_score ?? 0.9,
        verificationStatus: "Needs Verification",
      })),
      rawNotes: data.raw_text || input.text || "",
    };
  } catch {
    // Graceful deterministic fallback when backend endpoint is unreachable
    return await prescriptionStore.extractPrescription(input);
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const stats = await fetchApi<BackendStatsResponse>("/stats/");
    return {
      prescriptionsProcessed: stats.total_audits,
      awaitingVerification: stats.flagged_count,
      auditsReady: stats.approved_count,
      averageProcessingTimeMinutes: 1.4,
      criticalBlockedCases: stats.blocked_count,
      stewardshipComplianceRate: Math.round(stats.adherence_rate_pct),
      awareDistribution: stats.aware_distribution,
      topViolations: stats.top_violations,
    };
  } catch {
    return prescriptionStore.getMetrics();
  }
}

export function resetDemoData(): void {
  prescriptionStore.resetDemoData();
}

/**
 * [PATTERN: Strategy & Fallback]
 * Pure Deterministic Five-Tier AMR Sentinel Verification Engine
 * Implements the mathematical formula:
 * AMR_Risk_Score = min(100, 0.4 * P_class + 0.2 * P_duration + 0.4 * P_indication)
 */
export async function auditPrescription(caseData: PrescriptionCase): Promise<AuditResult> {
  const startTime = performance.now();

  // Try calling the FastAPI backend /api/v1/audit/
  try {
    const payload = {
      patient: {
        age_years: Number(caseData.patient.age) || 0,
        sex: caseData.patient.sex || "unknown",
        is_pregnant: caseData.patient.pregnancyStatus === "Pregnant",
        weight_kg: caseData.patient.weight_kg ? Number(caseData.patient.weight_kg) : null,
        egfr: caseData.patient.egfr ? Number(caseData.patient.egfr) : null,
        diagnosis_text: caseData.patient.symptoms || caseData.patient.suspectedDiagnosis || "",
      },
      prescription_lines: caseData.medicines.map((m) => ({
        raw_text: `${m.brandName} ${m.genericName} ${m.strength} ${m.frequency} x ${m.duration}`,
        drug_name: m.genericName || m.brandName,
        brand: m.brandName,
        generic: m.genericName,
        strength: m.strength,
        frequency: m.frequency,
        duration_days: parseDurationDays(m.duration),
        aware_tier: m.aware_tier || classifyAwareTier(m.genericName || m.brandName),
        drug_class: m.drug_class || detectDrugClass(m.genericName || m.brandName),
        is_fdc: m.is_fdc ?? detectIrrationalFdc(m.brandName, m.genericName),
      })),
      canonical_syndrome: caseData.patient.canonical_syndrome || caseData.patient.suspectedDiagnosis || null,
      has_culture_report: Boolean(caseData.patient.has_culture_report),
      has_positive_microbiology: Boolean(caseData.patient.has_positive_microbiology),
      is_outpatient: caseData.patient.is_outpatient ?? true,
    };

    const backendResult = await fetchApi<AuditResult>("/audit/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (backendResult && typeof backendResult.score === "number") {
      return backendResult;
    }
  } catch {
    // Backend offline: run client-side deterministic 5-Tier Verification Engine
  }

  return evaluateDeterministicRules(caseData, startTime);
}

// ---------------------------------------------------------------------------
// Client-Side Deterministic 5-Tier Clinical Rules Engine (Exact parity with app/engine/rules.py)
// ---------------------------------------------------------------------------

function parseDurationDays(durationStr?: string): number {
  if (!durationStr) return 5;
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}

function normalize(str?: string): string {
  return (str || "").toLowerCase().trim();
}

const FLUOROQUINOLONES = ["ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin", "norfloxacin", "gemifloxacin", "cifran", "cifran-500", "levomac", "avelox"];
const TETRACYCLINES = ["doxycycline", "tetracycline", "minocycline", "dox-100"];
const MACROLIDES = ["azithromycin", "clarithromycin", "erythromycin", "azithral"];
const CEPHALOSPORINS_3RD = ["cefixime", "ceftriaxone", "cefotaxime", "taxim-o", "monocef"];
const AMINOGLYCOSIDES = ["amikacin", "gentamicin", "tobramycin"];
const RESERVE_DRUGS = ["colistin", "linezolid", "tigecycline", "meropenem", "imipenem", "polymyxin b"];

function isFQ(drug: string): boolean {
  const norm = normalize(drug);
  return FLUOROQUINOLONES.some((fq) => norm.includes(fq));
}

function isTC(drug: string): boolean {
  const norm = normalize(drug);
  return TETRACYCLINES.some((tc) => norm.includes(tc));
}

function isReserve(drug: string): boolean {
  const norm = normalize(drug);
  return RESERVE_DRUGS.some((r) => norm.includes(r));
}

function isWatch(drug: string): boolean {
  const norm = normalize(drug);
  return isFQ(drug) || MACROLIDES.some((m) => norm.includes(m)) || CEPHALOSPORINS_3RD.some((c) => norm.includes(c));
}

function classifyAwareTier(drug: string): "Access" | "Watch" | "Reserve" {
  if (isReserve(drug)) return "Reserve";
  if (isWatch(drug)) return "Watch";
  return "Access";
}

function detectDrugClass(drug: string): string {
  if (isFQ(drug)) return "Fluoroquinolone";
  if (isTC(drug)) return "Tetracycline";
  if (MACROLIDES.some((m) => normalize(drug).includes(m))) return "Macrolide";
  if (CEPHALOSPORINS_3RD.some((c) => normalize(drug).includes(c))) return "3rd Gen Cephalosporin";
  if (AMINOGLYCOSIDES.some((a) => normalize(drug).includes(a))) return "Aminoglycoside";
  if (isReserve(drug)) return "Reserve Antimicrobial";
  return "Antimicrobial / Supportive";
}

function detectIrrationalFdc(brand?: string, generic?: string): boolean {
  const combo = `${normalize(brand)} ${normalize(generic)}`;
  return (
    (combo.includes("cefixime") && combo.includes("azithromycin")) ||
    (combo.includes("ofloxacin") && combo.includes("ornidazole")) ||
    (combo.includes("norfloxacin") && combo.includes("metronidazole"))
  );
}

function evaluateDeterministicRules(caseData: PrescriptionCase, startTime: number): AuditResult {
  const violations: RuleViolation[] = [];
  const remediations: RemediationOption[] = [];
  const patient = caseData.patient;
  const age = Number(patient.age) || 0;
  const isPregnant = patient.pregnancyStatus === "Pregnant";
  const egfr = patient.egfr !== "" && patient.egfr !== undefined ? Number(patient.egfr) : null;
  const diagnosis = normalize(`${patient.symptoms} ${patient.suspectedDiagnosis} ${patient.canonical_syndrome}`);

  const isViralDiagnosis =
    diagnosis.includes("viral") ||
    diagnosis.includes("common cold") ||
    diagnosis.includes("influenza") ||
    diagnosis.includes("flu") ||
    diagnosis.includes("rhinitis") ||
    diagnosis.includes("bronchitis");

  // --- TIER 1: Hard Contraindication Checks (Zero Tolerance -> BLOCKED) ---
  for (const med of caseData.medicines) {
    const drugName = med.genericName || med.brandName;

    // Tier 1.1: Pediatric FQ / Tetracycline
    if (age < 18 && (isFQ(drugName) || isTC(drugName))) {
      const cls = isFQ(drugName) ? "Fluoroquinolone" : "Tetracycline";
      violations.push({
        tier: 1,
        rule_id: "TIER1_PEDIATRIC_CONTRAINDICATION",
        rule_name: `Pediatric ${cls} Contraindication`,
        severity: "BLOCKED",
        drug: drugName,
        penalty_type: "contraindication",
        penalty_score: 100.0,
        rationale: `Patient age ${age} < 18y. ${cls}s cause musculoskeletal damage and pediatric dental enamel discoloration.`,
        remediation: `Discontinue ${drugName}. Switch to age-appropriate pediatric Amoxicillin or Cephalexin.`,
        citation: "ICMR STG Pediatric Guidelines & WHO AWaRe 2023",
      });
      remediations.push({
        recommendation_type: "CONTRAINDICATION_BLOCK",
        suggested_drug: "Amoxicillin / Cephalexin",
        suggested_duration_days: 5,
        guidance: `Immediately halt ${drugName}. Select pediatric-safe first-line Access antibiotic.`,
        source_citation: "ICMR Pediatric STG Section 4",
      });
    }

    // Tier 1.2: Pregnancy Contraindication
    if (isPregnant && (isFQ(drugName) || isTC(drugName) || normalize(drugName).includes("clarithromycin"))) {
      violations.push({
        tier: 1,
        rule_id: "TIER1_PREGNANCY_CONTRAINDICATION",
        rule_name: "Pregnancy Teratogenicity Contraindication",
        severity: "BLOCKED",
        drug: drugName,
        penalty_type: "contraindication",
        penalty_score: 100.0,
        rationale: `${drugName} is FDA Pregnancy Category C/D with documented teratogenic cartilage and fetal risk.`,
        remediation: "Discontinue immediately. Substitute with pregnancy-safe beta-lactams.",
        citation: "ICMR Antimicrobial Guidelines for Obstetrics",
      });
      remediations.push({
        recommendation_type: "SWITCH_DRUG",
        suggested_drug: "Amoxicillin-Clavulanate / Cefuroxime",
        suggested_duration_days: 5,
        guidance: "Switch to category-B safe beta-lactam.",
        source_citation: "WHO Pregnancy Guidance",
      });
    }

    // Tier 1.3: Severe Renal Impairment
    if (egfr !== null && egfr < 30 && (normalize(drugName).includes("nitrofurantoin") || AMINOGLYCOSIDES.some((a) => normalize(drugName).includes(a)))) {
      violations.push({
        tier: 1,
        rule_id: "TIER1_RENAL_CONTRAINDICATION",
        rule_name: "Severe Renal Toxicity Contraindication",
        severity: "BLOCKED",
        drug: drugName,
        penalty_type: "contraindication",
        penalty_score: 100.0,
        rationale: `Patient eGFR ${egfr} mL/min < 30. High risk of drug accumulation and nephrotoxicity.`,
        remediation: `Halt ${drugName}. Use renal-adjusted antimicrobial.`,
        citation: "KDIGO Clinical Practice Guideline",
      });
    }

    // Tier 1.4: Banned Irrational FDCs
    if (med.is_fdc || detectIrrationalFdc(med.brandName, med.genericName)) {
      violations.push({
        tier: 1,
        rule_id: "TIER1_BANNED_IRRATIONAL_FDC",
        rule_name: "Banned Irrational Fixed-Dose Combination",
        severity: "BLOCKED",
        drug: `${med.brandName} (${med.genericName})`,
        penalty_type: "fdc",
        penalty_score: 100.0,
        rationale: "Dual-antimicrobial FDC banned by Central Drugs Standard Control Organisation (CDSCO). Promotes multi-drug resistance.",
        remediation: "De-escalate to single targeted monotherapy agent.",
        citation: "Gazette of India Banned FDC Notification / ICMR STG",
      });
      remediations.push({
        recommendation_type: "SWITCH_DRUG",
        suggested_drug: "Single-agent Amoxicillin / Cefixime",
        suggested_duration_days: 5,
        guidance: "Prescribe single targeted agent rather than irrational combination.",
        source_citation: "CDSCO Ban Order",
      });
    }
  }

  // --- TIER 2: Indication Appropriateness ---
  if (isViralDiagnosis) {
    const antibioticsPrescribed = caseData.medicines.filter((m) => {
      const d = m.genericName || m.brandName;
      return isWatch(d) || isReserve(d) || normalize(d).includes("amoxicillin") || normalize(d).includes("penicillin");
    });

    if (antibioticsPrescribed.length > 0) {
      violations.push({
        tier: 2,
        rule_id: "TIER2_VIRAL_UNINDICATED_ANTIBIOTIC",
        rule_name: "Unindicated Antibiotic in Viral Infection",
        severity: "HIGH",
        drug: antibioticsPrescribed.map((m) => m.genericName || m.brandName).join(", "),
        penalty_type: "indication",
        penalty_score: 100.0,
        rationale: "Diagnosis indicates viral/self-limiting syndrome. Antibiotics provide zero clinical efficacy while generating resistance pressure.",
        remediation: "Discontinue antibiotic. Prescribe supportive symptomatic therapy (analgesics, hydration).",
        citation: "ICMR STG Respiratory Syndrome & WHO Guidance",
      });
      remediations.push({
        recommendation_type: "MANDATE_SYMPTOMATIC",
        guidance: "Deprescribe antimicrobial. Provide antipyretic/analgesic symptomatic relief with 48h watch-and-wait.",
        source_citation: "ICMR STG Acute Respiratory Tract Infection",
      });
    }
  }

  // --- TIER 3: WHO AWaRe Classification ---
  for (const med of caseData.medicines) {
    const drugName = med.genericName || med.brandName;
    if (isReserve(drugName) && !caseData.patient.has_positive_microbiology) {
      violations.push({
        tier: 3,
        rule_id: "TIER3_RESERVE_WITHOUT_MICROBIOLOGY",
        rule_name: "Reserve Drug Without Confirmed Microbiology",
        severity: "HIGH",
        drug: drugName,
        penalty_type: "class",
        penalty_score: 80.0,
        rationale: "WHO Reserve antimicrobials are strictly protected for life-threatening multi-drug resistant pathogens verified by culture.",
        remediation: "Reserve drug requires Infectious Disease Specialist approval and positive culture.",
        citation: "WHO AWaRe Classification 2023",
      });
    } else if (isWatch(drugName) && !caseData.patient.has_culture_report) {
      violations.push({
        tier: 3,
        rule_id: "TIER3_WATCH_ESCALATION",
        rule_name: "Empiric Watch-Tier Antimicrobial Use",
        severity: "MEDIUM",
        drug: drugName,
        penalty_type: "class",
        penalty_score: 45.0,
        rationale: `${drugName} belongs to WHO Watch tier. High resistance potential for outpatient empiric therapy.`,
        remediation: "Consider first-line Access tier agent unless culture sensitivity demonstrates resistance.",
        citation: "WHO AWaRe Framework & ICMR STG",
      });
    }
  }

  // --- TIER 4: Duration Violations ---
  for (const med of caseData.medicines) {
    const days = parseDurationDays(med.duration);
    const drugName = med.genericName || med.brandName;
    if (days > 7 && !isReserve(drugName)) {
      violations.push({
        tier: 4,
        rule_id: "TIER4_EXCESSIVE_DURATION",
        rule_name: "Excessive Course Duration",
        severity: "MEDIUM",
        drug: drugName,
        penalty_type: "duration",
        penalty_score: days > 14 ? 50.0 : 30.0,
        rationale: `Prescribed duration of ${days} days exceeds standard guideline duration of 3-7 days for outpatient treatment.`,
        remediation: "Shorten duration to 5 days to reduce selective pressure and adverse events.",
        citation: "ICMR Antimicrobial Stewardship Duration Guidelines",
      });
      remediations.push({
        recommendation_type: "REDUCE_DURATION",
        suggested_drug: drugName,
        suggested_duration_days: 5,
        guidance: `Curtail course duration from ${days} to 5 days.`,
        source_citation: "ICMR Outpatient Duration Guidelines",
      });
    }
  }

  // Mathematical Score Calculation
  const hasTier1 = violations.some((v) => v.tier === 1 || v.severity === "BLOCKED");
  const pClass = Math.min(100.0, violations.filter((v) => v.penalty_type === "class").reduce((acc, v) => acc + v.penalty_score, 0));
  const pDuration = Math.min(100.0, violations.filter((v) => v.penalty_type === "duration").reduce((acc, v) => acc + v.penalty_score, 0));
  const pIndication = Math.min(100.0, violations.filter((v) => v.penalty_type === "indication").reduce((acc, v) => acc + v.penalty_score, 0));

  const breakdown: PenaltiesBreakdown = {
    p_class: pClass,
    p_duration: pDuration,
    p_indication: pIndication,
  };

  let score: number;
  let status: "APPROVED" | "FLAGGED" | "BLOCKED";
  let band: "GREEN" | "AMBER" | "RED";

  if (hasTier1) {
    score = 100.0;
    status = "BLOCKED";
    band = "RED";
  } else {
    const rawScore = 0.4 * pClass + 0.2 * pDuration + 0.4 * pIndication;
    score = Math.round(Math.min(100.0, rawScore) * 10) / 10;
    if (violations.length === 0 && score === 0.0) {
      status = "APPROVED";
      band = "GREEN";
    } else {
      status = "FLAGGED";
      band = score >= 75.0 ? "RED" : score >= 35.0 ? "AMBER" : "GREEN";
    }
  }

  const latencyMs = Math.max(2, Math.round(performance.now() - startTime));

  return {
    status,
    score,
    band,
    penalties: breakdown,
    flags: violations,
    remediation_options: remediations,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
  };
}

