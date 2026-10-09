// [SOLID: SRP & DIP] Centralized Zustand store for AMR Sentinel Clinical Prescriptions
import { create } from "zustand";
import { 
  PrescriptionCase, 
  DashboardMetrics, 
  PatientContext, 
  MedicineEntry,
  AuditResult
} from "@/types/prescription";
import { 
  getPrescriptions, 
  savePrescription as apiSavePrescription, 
  resetDemoData as apiResetDemo,
  auditPrescription as localAuditPrescription
} from "@/lib/api";
import { prescriptionStore } from "@/lib/prescriptionStore";
import { ClinicalSamplePreset } from "@/lib/clinicalSamples";
import { fetchStewardshipStats } from "@/network/services/statsService";
import { extractFromText, extractFromImage } from "@/network/services/extractService";
import { submitPrescriptionAudit } from "@/network/services/auditService";
import { parseClinicalError, ClinicalError } from "@/lib/errors";
import { parseClinicalText, mergeParsedPatientContext } from "@/lib/clinicalTextParser";

export const createDefaultPatient = (): PatientContext => ({
  caseId: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  age: "",
  sex: "Male",
  pregnancyStatus: "Not applicable",
  allergies: "NKDA",
  symptoms: "",
  medicalHistory: "",
  suspectedDiagnosis: "",
  canonical_syndrome: "",
  has_culture_report: false,
  has_positive_microbiology: false,
  is_outpatient: true,
});

interface PrescriptionState {
  // --- Dashboard & Cases Collection ---
  cases: PrescriptionCase[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  error: ClinicalError | null;

  fetchCases: () => Promise<void>;
  getCaseById: (id: string) => PrescriptionCase | undefined;
  saveCase: (caseData: PrescriptionCase) => Promise<PrescriptionCase>;
  resetDemoData: () => Promise<void>;

  // --- New Prescription Intake Draft ---
  draftSourceType: "upload" | "manual";
  draftText: string;
  draftFile: File | null;
  draftPreviewUrl: string | null;
  draftPatient: PatientContext;
  isExtracting: boolean;

  setDraftSourceType: (type: "upload" | "manual") => void;
  setDraftText: (text: string) => void;
  setDraftImage: (file: File | null, previewUrl: string | null) => void;
  updateDraftPatient: (updates: Partial<PatientContext>) => void;
  loadDraftPreset: (preset: ClinicalSamplePreset) => void;
  syncDraftFromText: () => void;
  resetDraft: () => void;
  extractAndCreateCase: () => Promise<PrescriptionCase>;

  // --- Active Verification & Audit Case ---
  activeCase: PrescriptionCase | null;
  isAuditing: boolean;
  setActiveCase: (item: PrescriptionCase | null) => void;
  updateActivePatient: (updates: Partial<PatientContext>) => void;
  updateActiveMedicine: (updatedMed: MedicineEntry) => void;
  addActiveMedicine: (newMed: MedicineEntry) => void;
  removeActiveMedicine: (medId: string) => void;
  confirmAuditReady: () => Promise<PrescriptionCase>;
  auditActiveCase: () => Promise<AuditResult>;
}

export const usePrescriptionStore = create<PrescriptionState>((set, get) => ({
  // Initial collection state
  cases: [],
  metrics: {
    prescriptionsProcessed: 42,
    awaitingVerification: 18,
    auditsReady: 6,
    averageProcessingTimeMinutes: 1.4,
    criticalBlockedCases: 18,
    stewardshipComplianceRate: 14,
    awareDistribution: {
      access_pct: 100.0,
      watch_pct: 0.0,
      reserve_pct: 0.0,
      who_target_met: true,
    },
    topViolations: [],
  },
  isLoading: true,
  error: null,
  isAuditing: false,

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Fetch live metrics directly from real API stats endpoint
      const liveMetrics = await fetchStewardshipStats();

      // 2. Fetch real clinical cases created/audited by clinician
      const liveCases = prescriptionStore.getAll();

      set({
        cases: liveCases,
        metrics: liveMetrics,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const clinicalErr = parseClinicalError(err, "Loading hospital statistics");
      set({
        error: clinicalErr,
        isLoading: false,
      });
    }
  },

  getCaseById: (id: string) => {
    const cleanId = id.trim().toLowerCase();
    const found = get().cases.find((c) => c.id.toLowerCase() === cleanId);
    if (found) return found;
    // Fallback directly to persistent store if not in memory
    const directFromStorage = prescriptionStore.getById(id);
    if (directFromStorage) {
      set((state) => ({ cases: [...state.cases, directFromStorage] }));
      return directFromStorage;
    }
    return undefined;
  },

  saveCase: async (caseData: PrescriptionCase) => {
    const saved = prescriptionStore.save(caseData);
    set((state) => {
      const existingIndex = state.cases.findIndex(
        (c) => c.id.toLowerCase() === saved.id.toLowerCase()
      );
      const updatedCases =
        existingIndex >= 0
          ? state.cases.map((c, i) => (i === existingIndex ? saved : c))
          : [saved, ...state.cases];
      return { cases: updatedCases };
    });

    // Refresh live metrics from real API in background
    fetchStewardshipStats()
      .then((m) => set({ metrics: m }))
      .catch(() => {});

    return saved;
  },

  resetDemoData: async () => {
    prescriptionStore.resetDemoData();
    await get().fetchCases();
  },

  // Initial Intake Draft
  draftSourceType: "upload",
  draftText: "",
  draftFile: null,
  draftPreviewUrl: null,
  draftPatient: createDefaultPatient(),
  isExtracting: false,

  setDraftSourceType: (type) => set({ draftSourceType: type }),
  setDraftText: (text) => {
    // [PATTERN: Strategy & SOLID: SRP] Dynamically parse clinical text and sync fields
    const currentPatient = get().draftPatient;
    const parsed = parseClinicalText(text);
    const updatedPatient = mergeParsedPatientContext(currentPatient, parsed);
    set({
      draftText: text,
      draftPatient: updatedPatient,
    });
  },
  setDraftImage: (file, previewUrl) => set({ draftFile: file, draftPreviewUrl: previewUrl }),
  updateDraftPatient: (updates) =>
    set((state) => ({
      draftPatient: { ...state.draftPatient, ...updates },
    })),

  loadDraftPreset: (preset) => {
    // Dynamically merge preset patient details with any embedded notes
    const parsed = parseClinicalText(preset.sourceText);
    const mergedPatient = mergeParsedPatientContext(preset.data.patient, parsed);
    set({
      draftSourceType: "manual",
      draftText: preset.sourceText,
      draftPatient: mergedPatient,
      draftFile: null,
      draftPreviewUrl: null,
    });
  },

  syncDraftFromText: () => {
    const { draftText, draftPatient } = get();
    const parsed = parseClinicalText(draftText);
    const updated = mergeParsedPatientContext(draftPatient, parsed);
    set({ draftPatient: updated });
  },

  resetDraft: () =>
    set({
      draftSourceType: "upload",
      draftText: "",
      draftFile: null,
      draftPreviewUrl: null,
      draftPatient: createDefaultPatient(),
      isExtracting: false,
    }),

  extractAndCreateCase: async () => {
    const { draftSourceType, draftText, draftFile, draftPreviewUrl, draftPatient, saveCase } = get();
    set({ isExtracting: true });

    try {
      let extraction;

      if (draftSourceType === "upload") {
        if (!draftFile) {
          throw new ClinicalError({
            code: "VALIDATION_FAILED",
            title: "Prescription Image Required",
            userMessage: "Please select or capture a prescription slip image to extract.",
            hint: "Supported formats include JPG, PNG, and WebP.",
            canRetry: false,
          });
        }
        // Call Real Multimodal OCR API (/audit/from-image) - No mock fallback
        extraction = await extractFromImage(draftFile);
      } else {
        if (!draftText.trim()) {
          throw new ClinicalError({
            code: "VALIDATION_FAILED",
            title: "Prescription Text Required",
            userMessage: "Please enter clinical prescription details to extract.",
            hint: "Include medication names, dosage, and duration.",
            canRetry: false,
          });
        }
        // Call Real NLP Extraction API (/extract/) - No mock fallback
        extraction = await extractFromText(draftText);
      }

      const newCase: PrescriptionCase = {
        id: draftPatient.caseId || `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceType: draftSourceType,
        sourceText: draftText || `Prescription slip: ${draftFile?.name || "Uploaded scan"}`,
        imagePreviewUrl: draftPreviewUrl || undefined,
        imageFileName: draftFile?.name,
        patient: {
          ...draftPatient,
          ...extraction.patient,
        },
        medicines: extraction.medicines,
        workflowStatus: "Extraction Complete",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveCase(newCase);
      set({ activeCase: saved, isExtracting: false });
      return saved;
    } catch (err) {
      set({ isExtracting: false });
      throw parseClinicalError(err, "Prescription extraction");
    }
  },

  // Active Verification & Audit Case
  activeCase: null,
  setActiveCase: (item) => set({ activeCase: item }),

  updateActivePatient: (updates) => {
    const current = get().activeCase;
    if (!current) return;
    const updated = {
      ...current,
      patient: { ...current.patient, ...updates },
      updatedAt: new Date().toISOString(),
    };
    set({ activeCase: updated });
    get().saveCase(updated);
  },

  updateActiveMedicine: (updatedMed) => {
    const current = get().activeCase;
    if (!current) return;
    const updated = {
      ...current,
      medicines: current.medicines.map((m) => (m.id === updatedMed.id ? updatedMed : m)),
      updatedAt: new Date().toISOString(),
    };
    set({ activeCase: updated });
    get().saveCase(updated);
  },

  addActiveMedicine: (newMed) => {
    const current = get().activeCase;
    if (!current) return;
    const updated = {
      ...current,
      medicines: [...current.medicines, newMed],
      updatedAt: new Date().toISOString(),
    };
    set({ activeCase: updated });
    get().saveCase(updated);
  },

  removeActiveMedicine: (medId) => {
    const current = get().activeCase;
    if (!current) return;
    const updated = {
      ...current,
      medicines: current.medicines.filter((m) => m.id !== medId),
      updatedAt: new Date().toISOString(),
    };
    set({ activeCase: updated });
    get().saveCase(updated);
  },

  confirmAuditReady: async () => {
    const current = get().activeCase;
    if (!current) throw new Error("No active case to confirm");

    const finalized: PrescriptionCase = {
      ...current,
      workflowStatus: "Ready for Audit",
      updatedAt: new Date().toISOString(),
    };

    const saved = await get().saveCase(finalized);
    set({ activeCase: saved });
    return saved;
  },

  auditActiveCase: async () => {
    const current = get().activeCase;
    if (!current) throw new Error("No active case to audit");
    set({ isAuditing: true });

    try {
      // Real API call to /audit/
      const result = await submitPrescriptionAudit(current);

      const updatedCase: PrescriptionCase = {
        ...current,
        workflowStatus: "Audited",
        auditResult: result,
        updatedAt: new Date().toISOString(),
      };
      await get().saveCase(updatedCase);
      set({ activeCase: updatedCase, isAuditing: false });
      return result;
    } catch (err) {
      set({ isAuditing: false });
      throw parseClinicalError(err, "Prescription clinical audit");
    }
  },
}));
