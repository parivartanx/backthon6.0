// [SOLID: SRP & PATTERN: Strategy] Real-time clinical text parser
// Extracts patient demographics and clinical context dynamically from prescription notes

import { PatientContext, SexOption, PregnancyStatusOption } from "@/types/prescription";

export interface ParsedClinicalFields {
  age?: number | "";
  sex?: SexOption;
  weight_kg?: number | "";
  egfr?: number | "";
  caseId?: string;
  patientName?: string;
  pregnancyStatus?: PregnancyStatusOption;
  allergies?: string;
  symptoms?: string;
  suspectedDiagnosis?: string;
  medicalHistory?: string;
  is_outpatient?: boolean;
  has_culture_report?: boolean;
}

// [PATTERN: Strategy] Normalization helper for biological sex
function normalizeSex(raw: string): SexOption {
  const clean = raw.trim().toLowerCase();
  if (clean === "m" || clean === "male") return "Male";
  if (clean === "f" || clean === "female") return "Female";
  if (clean === "other") return "Other";
  return "Prefer not to specify";
}

// [SOLID: SRP] Parse freeform clinical text into structured patient attributes
export function parseClinicalText(text: string): ParsedClinicalFields {
  if (!text || typeof text !== "string") {
    return {};
  }

  const result: ParsedClinicalFields = {};

  // 1. Weight Extraction
  // Matches: "Weight: 52 kg", "Weight: 52", "Wt: 52kg", "Weight - 52 kg", "52 kg"
  const weightExplicitMatch = text.match(
    /(?:weight|wt\.?)[\s:=-]+(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos|kilograms)?\b/i
  );
  const standaloneKgMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:kg|kgs)\b/i);
  const emptyWeightMatch = text.match(/(?:weight|wt\.?)[\s:=-]*(?:\n|$)/i);

  if (weightExplicitMatch) {
    const val = parseFloat(weightExplicitMatch[1]);
    if (val > 0 && val <= 350) {
      result.weight_kg = val;
    }
  } else if (standaloneKgMatch) {
    const val = parseFloat(standaloneKgMatch[1]);
    if (val > 0 && val <= 350) {
      result.weight_kg = val;
    }
  } else if (emptyWeightMatch) {
    result.weight_kg = "";
  }

  // 2. Patient Name, Age, and Sex Extraction
  // Matches: "Patient: Amish Verma, 24M" or "Patient: Rahul Verma, 34/M" or "Pt: Sunita, 42F"
  const patientLineMatch = text.match(
    /(?:patient|pt\.?)[\s:=-]+([A-Za-z\s.]+?)[,\s]+(\d{1,3})\s*(?:yo|y\/o|yrs|yr|years)?\s*[\/,]?\s*(M|F|Male|Female)\b/i
  );

  if (patientLineMatch) {
    const name = patientLineMatch[1].trim();
    if (name.length > 1) {
      result.patientName = name;
    }
    const ageVal = parseInt(patientLineMatch[2], 10);
    if (ageVal >= 0 && ageVal <= 125) {
      result.age = ageVal;
    }
    result.sex = normalizeSex(patientLineMatch[3]);
  } else {
    // Check standalone patient name (e.g. "Patient: Rahul Verma", "Patient Name: Master Aarav Gupta")
    const standaloneNameMatch = text.match(
      /(?:patient(?:\s*name)?|pt\.?(?:\s*name)?)[\s:=-]+([A-Za-z\s.]+?)(?:[,\n\r]|$)/i
    );
    if (standaloneNameMatch) {
      const candidate = standaloneNameMatch[1].trim();
      if (candidate.length > 1 && !/^(male|female|adult|child|opd|slip|rx)$/i.test(candidate)) {
        result.patientName = candidate;
      }
    }

    // Check separate Age matches
    const explicitAgeMatch = text.match(
      /(?:age)[\s:=-]+(\d{1,3})\s*(?:yo|y\/o|yrs|yr|years)?\b/i
    );
    const ageUnitMatch = text.match(
      /\b(\d{1,3})\s*(?:yo|y\/o|yrs|yr|years old|years)\b/i
    );
    const ageSexComboMatch = text.match(/\b(\d{1,3})\s*[\/,]?\s*(M|F)\b/i);

    if (explicitAgeMatch) {
      const ageVal = parseInt(explicitAgeMatch[1], 10);
      if (ageVal >= 0 && ageVal <= 125) result.age = ageVal;
    } else if (ageSexComboMatch) {
      const ageVal = parseInt(ageSexComboMatch[1], 10);
      if (ageVal >= 0 && ageVal <= 125) {
        result.age = ageVal;
        result.sex = normalizeSex(ageSexComboMatch[2]);
      }
    } else if (ageUnitMatch) {
      const ageVal = parseInt(ageUnitMatch[1], 10);
      if (ageVal >= 0 && ageVal <= 125) result.age = ageVal;
    }

    // Check separate Sex matches if not already assigned
    if (!result.sex) {
      const sexLabelMatch = text.match(
        /(?:sex|gender)[\s:=-]+(male|female|other|m|f)\b/i
      );
      if (sexLabelMatch) {
        result.sex = normalizeSex(sexLabelMatch[1]);
      }
    }
  }

  // 3. Pregnancy Status
  const pregnancyMatch = text.match(
    /(?:pregnancy(?:\s*status)?)[\s:=-]+([^\n\r]+)/i
  );
  if (pregnancyMatch) {
    const val = pregnancyMatch[1].toLowerCase();
    if (val.includes("not pregnant") || val.includes("negative") || val.includes("no")) {
      result.pregnancyStatus = "Not pregnant";
    } else if (val.includes("pregnant") || val.includes("positive") || val.includes("yes")) {
      result.pregnancyStatus = "Pregnant";
      result.sex = "Female";
    }
  } else if (/\b(pregnant|gravida|primigravida|multigravida)\b/i.test(text)) {
    result.pregnancyStatus = "Pregnant";
    result.sex = "Female";
  }

  // 4. eGFR (Renal Function)
  const egfrMatch = text.match(
    /(?:egfr|gfr|creatinine clearance)[\s:=-]+(\d+(?:\.\d+)?)\b/i
  );
  if (egfrMatch) {
    const val = parseFloat(egfrMatch[1]);
    if (val >= 0 && val <= 250) {
      result.egfr = val;
    }
  }

  // 5. Suspected Diagnosis / Canonical Syndrome
  const diagnosisMatch = text.match(
    /(?:diagnosis|dx|impression|suspected diagnosis)[\s:=-]+([^\n\r]+)/i
  );
  if (diagnosisMatch) {
    const diag = diagnosisMatch[1].trim();
    if (diag.length > 2) {
      result.suspectedDiagnosis = diag;
    }
  }

  // 6. Presenting Symptoms & Chief Complaints
  const symptomsMatch = text.match(
    /(?:symptoms|presenting complaints?|chief complaints?|complaints?|c\/o)[\s:=-]+([^\n\r]+)/i
  );
  if (symptomsMatch) {
    const symp = symptomsMatch[1].trim();
    if (symp.length > 2) {
      result.symptoms = symp;
    }
  }

  // 7. Known Drug Allergies
  const allergyExplicitMatch = text.match(
    /(?:allerg(?:y|ies)|allergy alert|allergic to)[\s:=-]+([^\n\r]+)/i
  );
  const noAllergyMatch = text.match(
    /\b(no prior drug allergies|no known drug allergies|no known allergies|nkda|none recorded|nil allergies)\b/i
  );

  if (allergyExplicitMatch) {
    const val = allergyExplicitMatch[1].trim();
    if (val.length > 1) {
      result.allergies = val;
    }
  } else if (noAllergyMatch) {
    result.allergies = "No known drug allergies (NKDA)";
  }

  // 8. Relevant Medical History
  const historyMatch = text.match(
    /(?:history|past history|medical history|comorbidities)[\s:=-]+([^\n\r]+)/i
  );
  if (historyMatch) {
    const hist = historyMatch[1].trim();
    if (hist.length > 2) {
      result.medicalHistory = hist;
    }
  }

  // 9. Clinical Setting (Outpatient vs Inpatient)
  const settingMatch = text.match(
    /\b(outpatient|opd|clinic|inpatient|ipd|ward|icu|admitted)\b/i
  );
  if (settingMatch) {
    const lower = settingMatch[1].toLowerCase();
    result.is_outpatient = !["inpatient", "ipd", "ward", "icu", "admitted"].includes(lower);
  }

  // 10. Culture Report
  const cultureMatch = text.match(
    /(?:culture(?:\s*report)?|microbiology)[\s:=-]+([^\n\r]+)/i
  );
  if (cultureMatch) {
    const lower = cultureMatch[1].toLowerCase();
    if (lower.includes("yes") || lower.includes("positive") || lower.includes("available")) {
      result.has_culture_report = true;
    } else if (lower.includes("no") || lower.includes("negative") || lower.includes("pending") || lower.includes("empiric")) {
      result.has_culture_report = false;
    }
  }

  return result;
}

// [SOLID: SRP] Merges newly parsed fields with the current patient context
export function mergeParsedPatientContext(
  current: PatientContext,
  parsed: ParsedClinicalFields
): PatientContext {
  const updated: PatientContext = { ...current };

  if (parsed.patientName) {
    updated.patientName = parsed.patientName;
  }
  if (parsed.weight_kg !== undefined) {
    updated.weight_kg = parsed.weight_kg;
  }
  if (parsed.age !== undefined && parsed.age !== "") {
    updated.age = parsed.age;
    updated.age_years = typeof parsed.age === "number" ? parsed.age : undefined;
  }
  if (parsed.sex) {
    updated.sex = parsed.sex;
    if (parsed.sex === "Male") {
      updated.pregnancyStatus = "Not applicable";
    }
  }
  if (parsed.pregnancyStatus) {
    updated.pregnancyStatus = parsed.pregnancyStatus;
    if (parsed.pregnancyStatus === "Pregnant") {
      updated.is_pregnant = true;
      updated.sex = "Female";
    }
  }
  if (parsed.egfr !== undefined) {
    updated.egfr = parsed.egfr;
  }
  if (parsed.suspectedDiagnosis && parsed.suspectedDiagnosis.trim().length > 1) {
    const raw = parsed.suspectedDiagnosis.trim();
    updated.suspectedDiagnosis = raw;
    const lower = raw.toLowerCase();
    if (raw.startsWith("SYN_")) {
      updated.canonical_syndrome = raw;
    } else if (lower.includes("pneumonia") || lower.includes("cap")) {
      updated.canonical_syndrome = "SYN_CAP_MILD";
    } else if (lower.includes("uti") || lower.includes("cystitis") || lower.includes("dysuria")) {
      updated.canonical_syndrome = "SYN_UNCOMPLICATED_UTI";
    } else if (lower.includes("bronchitis")) {
      updated.canonical_syndrome = "SYN_ACUTE_BRONCHITIS";
    } else if (lower.includes("cold") || lower.includes("rhinopharyngitis")) {
      updated.canonical_syndrome = "SYN_COMMON_COLD";
    } else if (lower.includes("urti") || lower.includes("upper respiratory")) {
      updated.canonical_syndrome = "SYN_VIRAL_URTI";
    } else if (lower.includes("diarrhea")) {
      updated.canonical_syndrome = "SYN_WATERY_DIARRHEA";
    } else {
      updated.canonical_syndrome = raw;
    }
  } else if (updated.canonical_syndrome && updated.canonical_syndrome.trim().length <= 1) {
    // Prevent single-letter truncation (e.g. 'F') from displaying as canonical syndrome
    updated.canonical_syndrome = "";
  }
  if (parsed.symptoms) {
    updated.symptoms = parsed.symptoms;
  }
  if (parsed.allergies) {
    updated.allergies = parsed.allergies;
  }
  if (parsed.medicalHistory) {
    updated.medicalHistory = parsed.medicalHistory;
  }
  if (parsed.is_outpatient !== undefined) {
    updated.is_outpatient = parsed.is_outpatient;
  }
  if (parsed.has_culture_report !== undefined) {
    updated.has_culture_report = parsed.has_culture_report;
  }

  return updated;
}
