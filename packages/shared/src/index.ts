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

export const SCENARIO_CATEGORIES = [
  "Availability",
  "Latency",
  "Database",
  "Deployment",
  "Authentication",
  "Resource exhaustion",
  "Message queues",
  "Cascading failure",
  "Security monitoring",
] as const;

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
export const IMPLEMENTATION_STATUSES = ["ready", "preview", "planned"] as const;

export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type ImplementationStatus = (typeof IMPLEMENTATION_STATUSES)[number];
export type Severity = "SEV-1" | "SEV-2" | "SEV-3";
export type EvidenceCategory =
  "topology" | "logs" | "metrics" | "traces" | "alerts" | "deployments";

export interface ScenarioService {
  id: string;
  name: string;
  type: string;
  responsibility: string;
}

export interface InitialAlert {
  title: string;
  severity: "critical" | "warning";
  source: string;
  summary: string;
}

export interface ScenarioTimeline {
  startTime: string;
  briefingOffsetMinutes: number;
  simulatedWindowMinutes: number;
}

/** Safe to render in catalog and briefing clients. Contains no solution material. */
export interface PublicScenarioDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedDurationMinutes: number;
  environmentType: string;
  organization: string;
  severity: Severity;
  categories: ScenarioCategory[];
  services: ScenarioService[];
  initialAlerts: InitialAlert[];
  learningObjectives: string[];
  requiredEvidenceCategories: EvidenceCategory[];
  timeline: ScenarioTimeline;
  implementationStatus: ImplementationStatus;
  initialNotification: string;
  knownImpact: string[];
  availableTools: string[];
}

/** Server-only facilitator material. Never import into a Client Component. */
export interface PrivateScenarioDefinition {
  scenarioId: string;
  rootCauseSummary: string;
  validCorrectiveActions: string[];
  incorrectActionExplanations: Record<string, string>;
  hiddenEvidence: string[];
}

export interface ScenarioDefinition {
  public: PublicScenarioDefinition;
  private: PrivateScenarioDefinition;
}
