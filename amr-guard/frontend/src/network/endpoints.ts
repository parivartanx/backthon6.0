// [SOLID: SRP] Centralized API Endpoints & Route Definitions
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://nine-peaches-wash.loca.lt/api/v1";

export const ENDPOINTS = {
  HEALTH: "/health",
  ROOT_HEALTH: "/",
  STATS: "/stats/",
  EXTRACT: "/extract/",
  AUDIT: "/audit/",
  AUDIT_FROM_IMAGE: "/audit/from-image",
  REMEDIATE: "/remediate/",
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
