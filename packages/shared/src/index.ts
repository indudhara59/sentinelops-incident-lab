export const PRODUCT_NAME = "SentinelOps Incident Lab" as const;
export const API_VERSION = "v1" as const;

export type ServiceStatus = "operational" | "degraded" | "unavailable";

export interface StatusResponse {
  service: string;
  version: string;
  status: ServiceStatus;
  environment: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    request_id: string;
  };
}
