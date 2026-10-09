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
  extractPrescription as apiExtractPrescription, 
  getDashboardMetrics,
  resetDemoData as apiResetDemo,
  auditPrescription
} from "@/lib/api";
import { prescriptionStore } from "@/lib/prescriptionStore";
import { ClinicalSamplePreset } from "@/lib/clinicalSamples";

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
  error: string | null;

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
    prescriptionsProcessed: 28,
    awaitingVerification: 4,
    auditsReady: 19,
    averageProcessingTimeMinutes: 1.8,
    criticalBlockedCases: 3,
    stewardshipComplianceRate: 88,
  },
  isLoading: true,
  error: null,
  isAuditing: false,

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const [fetchedCases, fetchedMetrics] = await Promise.all([
        getPrescriptions(),
        getDashboardMetrics(),
      ]);
      set({ cases: fetchedCases, metrics: fetchedMetrics, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load prescriptions",
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
    const saved = await apiSavePrescription(caseData);
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
    // Refresh metrics in background
    getDashboardMetrics().then((m) => set({ metrics: m })).catch(() => {});
    return saved;
  },

  resetDemoData: async () => {
    apiResetDemo();
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
  setDraftText: (text) => set({ draftText: text }),
  setDraftImage: (file, previewUrl) => set({ draftFile: file, draftPreviewUrl: previewUrl }),
  updateDraftPatient: (updates) =>
    set((state) => ({
      draftPatient: { ...state.draftPatient, ...updates },
    })),

  loadDraftPreset: (preset) =>
    set({
      draftSourceType: "manual",
      draftText: preset.sourceText,
      draftPatient: { ...preset.data.patient },
      draftFile: null,
      draftPreviewUrl: null,
    }),

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
      const extraction = await apiExtractPrescription({
        sourceType: draftSourceType,
        text: draftText,
        file: draftFile || undefined,
      });

      const newCase: PrescriptionCase = {
        id: draftPatient.caseId || `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceType: draftSourceType,
        sourceText: draftText || "Document scan uploaded via intake portal.",
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
      throw err;
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
      const result = await auditPrescription(current);
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
      throw err;
    }
  },
}));
