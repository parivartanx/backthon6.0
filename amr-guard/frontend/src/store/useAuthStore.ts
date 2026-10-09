// [SOLID: SRP & DIP] Dedicated Authentication & Clinician Profile Store
// Manages clinician credentials, active session, stewardship preferences, and multi-profile demo switching

import { create } from "zustand";

export interface ClinicianPreferences {
  defaultGuideline: "ICMR STG 2022" | "WHO AWaRe 2023" | "Sanford Guide";
  enforcementMode: "Strict (Block Contraindicated)" | "Advisory (Warn Clinician)";
  autoAuditOnExtract: boolean;
  notifyOnHighRiskAudit: boolean;
  requireMicrobiologyOnWatch: boolean;
}

export interface ClinicianProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  registrationNumber: string;
  stateMedicalCouncil: string;
  hospital: string;
  department: string;
  phone: string;
  specialization: string;
  avatarInitials: string;
  avatarUrl?: string;
  verifiedAt: string;
  preferences: ClinicianPreferences;
}

export const DEMO_CLINICIANS: ClinicianProfile[] = [
  {
    id: "doc-sharma",
    name: "Dr. Ananya Sharma, MD",
    email: "ananya.sharma@amr-sentinel.health",
    role: "Lead Antimicrobial Steward",
    designation: "Senior Consultant - Infectious Diseases",
    registrationNumber: "MCI-IND-2018-84920",
    stateMedicalCouncil: "Delhi Medical Council",
    hospital: "AIIMS New Delhi / Outpatient OPD",
    department: "Infectious Diseases & Clinical Microbiology",
    phone: "+91 98101 23456",
    specialization: "Antimicrobial Resistance & Rational Therapeutics",
    avatarInitials: "AS",
    verifiedAt: "2018-06-15",
    preferences: {
      defaultGuideline: "ICMR STG 2022",
      enforcementMode: "Strict (Block Contraindicated)",
      autoAuditOnExtract: true,
      notifyOnHighRiskAudit: true,
      requireMicrobiologyOnWatch: true,
    },
  },
  {
    id: "doc-verma",
    name: "Dr. Rajesh Verma, MBBS, DNB",
    email: "rajesh.verma@apollohealth.org",
    role: "OPD Medical Officer",
    designation: "Attending Consultant - Internal Medicine",
    registrationNumber: "MCI-IND-2015-62118",
    stateMedicalCouncil: "Maharashtra Medical Council",
    hospital: "Apollo Multi-Specialty Hospital, Mumbai",
    department: "General Medicine & Outpatient Services",
    phone: "+91 98220 54321",
    specialization: "Adult Outpatient Infections & Primary Care",
    avatarInitials: "RV",
    verifiedAt: "2015-09-20",
    preferences: {
      defaultGuideline: "ICMR STG 2022",
      enforcementMode: "Advisory (Warn Clinician)",
      autoAuditOnExtract: true,
      notifyOnHighRiskAudit: false,
      requireMicrobiologyOnWatch: false,
    },
  },
  {
    id: "doc-mehta",
    name: "Dr. Priya Mehta, PharmD, BCPS",
    email: "priya.mehta@fortishealth.com",
    role: "Clinical Pharmacist",
    designation: "Lead Antimicrobial Stewardship Pharmacist",
    registrationNumber: "PCI-DL-2020-19402",
    stateMedicalCouncil: "Pharmacy Council of India",
    hospital: "Fortis Memorial Research Institute",
    department: "Department of Clinical Pharmacy",
    phone: "+91 99112 87654",
    specialization: "Dose Optimization & Formulary Surveillance",
    avatarInitials: "PM",
    verifiedAt: "2020-03-10",
    preferences: {
      defaultGuideline: "WHO AWaRe 2023",
      enforcementMode: "Strict (Block Contraindicated)",
      autoAuditOnExtract: true,
      notifyOnHighRiskAudit: true,
      requireMicrobiologyOnWatch: true,
    },
  },
];

interface AuthState {
  user: ClinicianProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<ClinicianProfile>) => void;
  updatePreferences: (updates: Partial<ClinicianPreferences>) => void;
  switchClinician: (clinicianId: string) => void;
}

const STORAGE_KEY_USER = "amr_sentinel_auth_user";
const STORAGE_KEY_AUTH = "amr_sentinel_auth_token";

const getInitialUser = (): ClinicianProfile => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback if local storage parse fails
    }
  }
  return DEMO_CLINICIANS[0];
};

const getInitialAuth = (): boolean => {
  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem(STORAGE_KEY_AUTH);
      if (token === "unauthenticated") {
        return false;
      }
    } catch {
      // Fallback
    }
  }
  return true; // Default logged in as demo doctor for developer convenience
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialAuth(),
  isLoading: false,
  error: null,

  login: async (email: string) => {
    set({ isLoading: true, error: null });

    // Simulate authenticating against hospital AD/LDAP or JWT backend
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Match existing profile or adapt current user
    const matched = DEMO_CLINICIANS.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase()
    );

    const activeUser = matched || {
      ...get().user,
      email: email.trim(),
      name: email.split("@")[0].replace(".", " ").replace(/^./, (s) => s.toUpperCase()),
      avatarInitials: email.slice(0, 2).toUpperCase(),
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(activeUser));
        localStorage.setItem(STORAGE_KEY_AUTH, "demo-session-token-valid");
      } catch {
        // Ignored
      }
    }

    set({
      user: activeUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    return true;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, "unauthenticated");
      } catch {
        // Ignored
      }
    }
    set({ isAuthenticated: false });
  },

  updateProfile: (updates: Partial<ClinicianProfile>) => {
    const updatedUser = {
      ...get().user,
      ...updates,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      } catch {
        // Ignored
      }
    }

    set({ user: updatedUser });
  },

  updatePreferences: (prefUpdates: Partial<ClinicianPreferences>) => {
    const currentUser = get().user;
    const updatedUser = {
      ...currentUser,
      preferences: {
        ...currentUser.preferences,
        ...prefUpdates,
      },
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      } catch {
        // Ignored
      }
    }

    set({ user: updatedUser });
  },

  switchClinician: (clinicianId: string) => {
    const target = DEMO_CLINICIANS.find((c) => c.id === clinicianId) || DEMO_CLINICIANS[0];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(target));
        localStorage.setItem(STORAGE_KEY_AUTH, "demo-session-token-valid");
      } catch {
        // Ignored
      }
    }
    set({ user: target, isAuthenticated: true });
  },
}));
