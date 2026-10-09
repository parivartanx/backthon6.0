// [SOLID: SRP] Global Feedback Dialogs State Management
import { create } from "zustand";
import { ClinicalError } from "@/lib/errors";

export interface ErrorDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  hint?: string;
  code?: string;
  canRetry?: boolean;
  onRetry?: () => void;
  onClose?: () => void;
}

export interface SuccessDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

interface FeedbackState {
  errorDialog: ErrorDialogState;
  successDialog: SuccessDialogState;

  showError: (options: {
    error?: unknown;
    title?: string;
    message?: string;
    hint?: string;
    canRetry?: boolean;
    onRetry?: () => void;
    onClose?: () => void;
  }) => void;
  closeError: () => void;

  showSuccess: (options: {
    title: string;
    message: string;
    details?: string;
    primaryLabel?: string;
    onPrimary?: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
  }) => void;
  closeSuccess: () => void;
}

const initialError: ErrorDialogState = {
  isOpen: false,
  title: "Clinical Notice",
  message: "",
  hint: undefined,
  code: undefined,
  canRetry: false,
};

const initialSuccess: SuccessDialogState = {
  isOpen: false,
  title: "Operation Successful",
  message: "",
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  errorDialog: initialError,
  successDialog: initialSuccess,

  showError: (options) => {
    let title = options.title || "Clinical Notice";
    let message = options.message || "An unexpected error occurred.";
    let hint = options.hint;
    let code: string | undefined = undefined;
    let canRetry = Boolean(options.canRetry || options.onRetry);

    if (options.error instanceof ClinicalError) {
      title = options.title || options.error.title;
      message = options.message || options.error.userMessage;
      hint = options.hint || options.error.hint;
      code = options.error.code;
      if (options.error.canRetry !== undefined && !options.canRetry) {
        canRetry = options.error.canRetry;
      }
    } else if (options.error instanceof Error) {
      message = options.message || options.error.message;
    }

    set({
      errorDialog: {
        isOpen: true,
        title,
        message,
        hint,
        code,
        canRetry,
        onRetry: options.onRetry,
        onClose: options.onClose,
      },
    });
  },

  closeError: () => {
    set((state) => {
      state.errorDialog.onClose?.();
      return { errorDialog: { ...initialError } };
    });
  },

  showSuccess: (options) => {
    set({
      successDialog: {
        isOpen: true,
        title: options.title,
        message: options.message,
        details: options.details,
        primaryLabel: options.primaryLabel || "Continue",
        onPrimary: options.onPrimary,
        secondaryLabel: options.secondaryLabel,
        onSecondary: options.onSecondary,
      },
    });
  },

  closeSuccess: () => {
    set({ successDialog: { ...initialSuccess } });
  },
}));
