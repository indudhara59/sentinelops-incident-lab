export const INCIDENT_STAGES = [
  "Normal",
  "Deployment completed",
  "Connection leak begins",
  "Database pool saturation",
  "Order-service latency increase",
  "Checkout errors",
  "Incident mitigation",
  "Recovery",
  "Completed",
] as const;
export type IncidentStage = (typeof INCIDENT_STAGES)[number];
export type SimulationStatus = "ready" | "running" | "paused" | "completed";
export type ToolId =
  | "overview"
  | "alerts"
  | "logs"
  | "metrics"
  | "traces"
  | "deployments"
  | "evidence"
  | "actions"
  | "notes";
export type Health = "healthy" | "degraded" | "critical" | "recovering";
export type EvidenceSource =
  "Logs" | "Metrics" | "Traces" | "Deployments" | "Alerts";
export type HypothesisStatus = "unresolved" | "supported" | "contradicted";
export type ActionId =
  | "restart"
  | "scale"
  | "rollback"
  | "increase-pool"
  | "disable-retry"
  | "pause-consumer"
  | "observe";

export interface ServiceState {
  id: string;
  name: string;
  type: string;
  dependencies: string[];
  health: Health;
  requestsPerMinute: number;
  errorRate: number;
  latencyMs: number;
}
export interface LogEntry {
  id: string;
  second: number;
  level: "INFO" | "WARN" | "ERROR";
  service: string;
  message: string;
  fields: Record<string, string | number>;
}
export interface MetricPoint {
  second: number;
  orderLatencyMs: number;
  checkoutErrorRate: number;
  dbPoolUsed: number;
  dbPoolMax: number;
}
export interface TimelineEntry {
  id: string;
  second: number;
  kind: "system" | "alert" | "action" | "recovery";
  title: string;
  description: string;
}
export interface EvidenceDefinition {
  id: string;
  source: EvidenceSource;
  availableAt: number;
  timestamp: string;
  service: string;
  summary: string;
  fields: Record<string, string | number>;
}
export interface CollectedEvidence extends EvidenceDefinition {
  annotation: string;
  hypothesisIds: string[];
}
export interface Hypothesis {
  id: string;
  title: string;
  notes: string;
  status: HypothesisStatus;
  evidenceIds: string[];
}
export interface PlayerAction {
  id: string;
  action: ActionId;
  label: string;
  second: number;
  risk: string;
  effect: string;
}
export interface SimulationModifiers {
  poolBonus: number;
  latencyReduction: number;
  errorReduction: number;
  consumerPaused: boolean;
}

export interface SimulationState {
  scenarioId: string;
  seed: number;
  elapsedSeconds: number;
  tick: number;
  stage: IncidentStage;
  status: SimulationStatus;
  speed: 1 | 2 | 4;
  services: ServiceState[];
  logs: LogEntry[];
  metrics: MetricPoint[];
  timeline: TimelineEntry[];
  collectedEvidence: CollectedEvidence[];
  hypotheses: Hypothesis[];
  actions: PlayerAction[];
  notes: string;
  selectedServiceId: string | null;
  activeTool: ToolId;
  mitigationAt: number | null;
  modifiers: SimulationModifiers;
  announcement: string;
}

export type SimulationEvent =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ADVANCE" }
  | { type: "RESET" }
  | { type: "SET_SPEED"; speed: 1 | 2 | 4 }
  | { type: "SELECT_SERVICE"; serviceId: string | null }
  | { type: "SET_TOOL"; tool: ToolId }
  | { type: "COLLECT_EVIDENCE"; evidence: EvidenceDefinition }
  | { type: "ANNOTATE_EVIDENCE"; evidenceId: string; annotation: string }
  | { type: "CREATE_HYPOTHESIS"; title: string; notes: string }
  | {
      type: "SET_HYPOTHESIS_STATUS";
      hypothesisId: string;
      status: HypothesisStatus;
    }
  | { type: "ATTACH_EVIDENCE"; hypothesisId: string; evidenceId: string }
  | { type: "SET_NOTES"; notes: string }
  | { type: "PERFORM_ACTION"; action: ActionId };
