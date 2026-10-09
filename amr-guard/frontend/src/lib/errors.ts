// [SOLID: SRP & OCP] Enterprise Clinical Error Classification & User-Friendly Messages
import axios from "axios";

export type ClinicalErrorCode =
  | "NETWORK_OFFLINE"
  | "TIMEOUT"
  | "VALIDATION_FAILED"
  | "EXTRACTION_FAILED"
  | "AUDIT_FAILED"
  | "SERVER_ERROR"
  | "NOT_FOUND"
  | "TUNNEL_INTERSTITIAL"
  | "UNKNOWN";

export interface ClinicalErrorDetails {
  code: ClinicalErrorCode;
  title: string;
  userMessage: string;
  hint?: string;
  status?: number;
  canRetry: boolean;
  fieldErrors?: Record<string, string>;
  originalError?: unknown;
}

export class ClinicalError extends Error implements ClinicalErrorDetails {
  public readonly code: ClinicalErrorCode;
  public readonly title: string;
  public readonly userMessage: string;
  public readonly hint?: string;
  public readonly status?: number;
  public readonly canRetry: boolean;
  public readonly fieldErrors?: Record<string, string>;
  public readonly originalError?: unknown;

  constructor(details: ClinicalErrorDetails) {
    super(details.userMessage);
    this.name = "ClinicalError";
    this.code = details.code;
    this.title = details.title;
    this.userMessage = details.userMessage;
    this.hint = details.hint;
    this.status = details.status;
    this.canRetry = details.canRetry;
    this.fieldErrors = details.fieldErrors;
    this.originalError = details.originalError;
    Object.setPrototypeOf(this, ClinicalError.prototype);
  }
}

/**
 * Transforms raw network, HTTP, or runtime errors into clear, doctor-friendly clinical messages.
 */
export function parseClinicalError(
  err: unknown,
  fallbackContext: string = "Processing clinical data"
): ClinicalError {
  if (err instanceof ClinicalError) {
    return err;
  }

  // Axios-specific error inspection
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const responseData = err.response?.data;

    // Edge Case 1: Request Timeout
    if (err.code === "ECONNABORTED" || err.message?.toLowerCase().includes("timeout")) {
      return new ClinicalError({
        code: "TIMEOUT",
        title: "Clinical Service Request Timed Out",
        userMessage:
          "The AMR Sentinel clinical engine took longer than expected to analyze the prescription.",
        hint: "Please click 'Try Again' or verify your network connection.",
        status: 408,
        canRetry: true,
        originalError: err,
      });
    }

    // Edge Case 2: Localtunnel Interstitial HTML or non-JSON returned
    if (
      typeof responseData === "string" &&
      (responseData.includes("<!DOCTYPE html>") || responseData.includes("localtunnel"))
    ) {
      return new ClinicalError({
        code: "TUNNEL_INTERSTITIAL",
        title: "Tunnel Interstitial Notice",
        userMessage:
          "The secure gateway returned a reminder screen instead of clinical data.",
        hint: "The request has been configured with bypass headers. Please try again.",
        status: status || 403,
        canRetry: true,
        originalError: err,
      });
    }

    // Edge Case 3: Network offline / Connection refused
    if (!err.response || err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return new ClinicalError({
        code: "NETWORK_OFFLINE",
        title: "Clinical Server Connection Notice",
        userMessage:
          "Could not reach the AMR Sentinel decision support server. The system is operating in resilient offline mode.",
        hint: "Please ensure your internet connection is active and the API service is running.",
        canRetry: true,
        originalError: err,
      });
    }

    // Edge Case 4: 422 Unprocessable Entity (FastAPI / Pydantic validation failure)
    if (status === 422) {
      const fieldErrors: Record<string, string> = {};
      let userFriendlyMessage = "Some patient or medication parameters could not be validated.";

      if (Array.isArray(responseData?.detail)) {
        const errorList = responseData.detail as Array<{ loc?: string[]; msg?: string }>;
        const missingFields = errorList
          .map((item) => {
            const fieldName = item.loc?.[item.loc.length - 1] || "field";
            fieldErrors[fieldName] = item.msg || "Invalid value";
            return formatFieldLabel(fieldName);
          })
          .filter(Boolean);

        if (missingFields.length > 0) {
          userFriendlyMessage = `Please review the following items: ${missingFields.join(", ")}.`;
        }
      } else if (typeof responseData?.detail === "string") {
        userFriendlyMessage = responseData.detail;
      }

      return new ClinicalError({
        code: "VALIDATION_FAILED",
        title: "Incomplete Clinical Information",
        userMessage: userFriendlyMessage,
        hint: "Verify patient age, symptoms, and medication frequency before proceeding.",
        status: 422,
        canRetry: false,
        fieldErrors,
        originalError: err,
      });
    }

    // Edge Case 5: 400 Bad Request
    if (status === 400) {
      const detail = responseData?.detail || "The prescription format could not be processed.";
      return new ClinicalError({
        code: "VALIDATION_FAILED",
        title: "Invalid Prescription Format",
        userMessage: typeof detail === "string" ? detail : "Invalid prescription data.",
        hint: "Please make sure medicine names and dosing instructions are provided.",
        status: 400,
        canRetry: false,
        originalError: err,
      });
    }

    // Edge Case 6: 404 Not Found
    if (status === 404) {
      return new ClinicalError({
        code: "NOT_FOUND",
        title: "Record Not Found",
        userMessage: "The requested patient prescription could not be located on the server.",
        hint: "It may have been recently archived or created under a different case ID.",
        status: 404,
        canRetry: false,
        originalError: err,
      });
    }

    // Edge Case 7: 500 Internal Server Error
    if (status === 500) {
      const detail = responseData?.detail;
      return new ClinicalError({
        code: "SERVER_ERROR",
        title: "Clinical Engine Notice",
        userMessage:
          "The antimicrobial stewardship engine encountered a temporary computation issue while auditing this prescription.",
        hint: "Your draft has been preserved. Please retry in a few moments.",
        status: 500,
        canRetry: true,
        originalError: detail || err,
      });
    }

    // Edge Case 8: 502 / 503 / 504 Gateway / Service Unavailable
    if (status && status >= 502 && status <= 504) {
      return new ClinicalError({
        code: "SERVER_ERROR",
        title: "Decision Support Service Temporarily Unavailable",
        userMessage:
          "The AMR-Guard clinical verification service is currently restarting or undergoing brief maintenance.",
        hint: "Please wait a moment and try again.",
        status,
        canRetry: true,
        originalError: err,
      });
    }
  }

  // Handle standard JavaScript Error
  if (err instanceof Error) {
    return new ClinicalError({
      code: "UNKNOWN",
      title: "Clinical Processing Notice",
      userMessage: err.message || `${fallbackContext} encountered an unexpected issue.`,
      hint: "Please check the entered values and retry.",
      canRetry: true,
      originalError: err,
    });
  }

  // Fallback for unknown error shapes
  return new ClinicalError({
    code: "UNKNOWN",
    title: "Clinical Notification",
    userMessage: `${fallbackContext} could not be completed.`,
    hint: "Please try again or contact system support if the problem persists.",
    canRetry: true,
    originalError: err,
  });
}

function formatFieldLabel(fieldName: string): string {
  switch (fieldName) {
    case "age_years":
      return "Patient Age";
    case "sex":
      return "Patient Sex";
    case "diagnosis_text":
      return "Symptoms / Diagnosis";
    case "text":
      return "Prescription Text";
    case "prescription_lines":
      return "Medication List";
    default:
      return fieldName.replace(/_/g, " ");
  }
}
