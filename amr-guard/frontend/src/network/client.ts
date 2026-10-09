// [SOLID: DIP & SRP] Dedicated Axios HTTP Client with Localtunnel Interceptors & Error Normalization
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "./endpoints";
import { parseClinicalError, ClinicalError } from "@/lib/errors";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    // Localtunnel friendly reminder bypass header
    "bypass-tunnel-reminder": "true",
    Accept: "application/json",
  },
});

// Request Interceptor: Dynamic Content-Type handling
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If sending FormData (e.g. image OCR), let the browser set multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => {
    return Promise.reject(parseClinicalError(error, "Preparing network request"));
  }
);

// Response Interceptor: Tunnel Interstitial detection & Error Normalization
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if Localtunnel served an HTML interstitial page despite bypass header
    if (
      typeof response.data === "string" &&
      (response.data.includes("<!DOCTYPE html>") || response.data.includes("localtunnel"))
    ) {
      const err = new ClinicalError({
        code: "TUNNEL_INTERSTITIAL",
        title: "Tunnel Interstitial Notice",
        userMessage: "The API gateway returned a reminder screen instead of data.",
        hint: "Bypass header was sent. Please retry your action.",
        status: 403,
        canRetry: true,
      });
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    // Normalize into ClinicalError for consistent doctor-facing handling
    const clinicalErr = parseClinicalError(error);
    return Promise.reject(clinicalErr);
  }
);
