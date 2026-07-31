export const COLLECTIONS = {
  users: "users",
  accounts: "accounts",
  sessions: "sessions",
  incidentSessions: "incident_sessions",
  incidentReports: "incident_reports",
  evidenceItems: "evidence_items",
  hypotheses: "hypotheses",
  savedScenarios: "saved_scenarios",
  userPreferences: "user_preferences",
  learningProgress: "learning_progress",
} as const;

export const PERSISTENCE_LIMITS = {
  title: 160,
  note: 4_000,
  reportText: 100_000,
  timelineEvents: 500,
  actions: 250,
  evidence: 100,
  hypotheses: 50,
  telemetrySeries: 24,
  telemetryPointsPerSeries: 120,
  pageSize: 25,
  maximumPageSize: 50,
} as const;

export type IncidentStatus = "active" | "paused" | "completed" | "abandoned";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type IncidentSessionDocument = {
  _id: string;
  ownerId: string;
  scenarioId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  difficulty: Difficulty;
  status: IncidentStatus;
  scenarioVersion: string;
  engineVersion: string;
  seed: string;
  simulationTimeMs: number;
  score?: number;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  summaryTelemetry: Array<{
    metric: string;
    service: string;
    points: Array<{ timestamp: number; value: number }>;
  }>;
  importantTimeline: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
};

export type IncidentReportDocument = {
  _id: string;
  ownerId: string;
  incidentSessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  score: number;
  summary: string;
  report: Record<string, unknown>;
  createdAt: Date;
  completedAt: Date;
};

export type UserPreferencesDocument = {
  _id: string;
  ownerId: string;
  displayName: string;
  theme: "system" | "light" | "dark";
  reducedMotion: boolean;
  defaultSimulationSpeed: 0.5 | 1 | 2 | 4;
  telemetryDensity: "compact" | "comfortable";
  createdAt: Date;
  updatedAt: Date;
};

export type LearningProgressDocument = {
  _id: string;
  ownerId: string;
  courseVersion: string;
  completedStepIds: string[];
  currentStepId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function boundText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

export function boundedArray<T>(value: unknown, maximum: number): T[] {
  return Array.isArray(value) ? (value.slice(-maximum) as T[]) : [];
}
