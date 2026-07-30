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
export type AlertActionId = "ack-alert" | "assign-alert" | "silence-alert";
export type AlertStatus = "firing" | "acknowledged" | "silenced";

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
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  service: string;
  serviceName: string;
  traceId: string;
  spanId: string;
  deploymentVersion: string;
  requestId: string;
  message: string;
  fields: Record<string, string | number | boolean>;
}
export interface MetricPoint {
  second: number;
  requestRate: number;
  orderLatencyMs: number;
  latencyP50Ms: number;
  latencyP99Ms: number;
  checkoutErrorRate: number;
  cpuPercent: number;
  memoryMb: number;
  dbPoolUsed: number;
  dbPoolMax: number;
  dbPoolUtilizationPercent: number;
  queueDepth: number;
  serviceRestarts: number;
}
export interface SpanRecord {
  id: string;
  parentId: string | null;
  name: string;
  service: string;
  startMs: number;
  durationMs: number;
  status: "OK" | "ERROR";
  attributes: Record<string, string | number | boolean>;
  critical: boolean;
  relatedLogIds: string[];
}
export interface TraceRecord {
  id: string;
  second: number;
  timestamp: string;
  rootService: string;
  durationMs: number;
  status: "OK" | "ERROR";
  spans: SpanRecord[];
}
export interface AlertRecord {
  id: string;
  title: string;
  severity: "warning" | "critical";
  source: string;
  service: string;
  firstTriggered: number;
  lastUpdated: number;
  status: AlertStatus;
  assignedTo: "self" | null;
  telemetryTool: "metrics" | "logs";
  metric: string;
  threshold: string;
}
export interface DeploymentRecord {
  id: string;
  service: string;
  version: string;
  previousVersion: string;
  second: number;
  timestamp: string;
  status: "completed" | "rolled-back";
  changeSummary: string;
  reference: string;
  diff: string[];
  rollbackAvailable: boolean;
}
export interface CorrelationContext {
  service: string | null;
  traceId: string | null;
  deploymentId: string | null;
  timeRange: "5m" | "15m" | "30m" | "all";
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
  action: ActionId | AlertActionId;
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
  traces: TraceRecord[];
  alerts: AlertRecord[];
  timeline: TimelineEntry[];
  collectedEvidence: CollectedEvidence[];
  hypotheses: Hypothesis[];
  actions: PlayerAction[];
  notes: string;
  selectedServiceId: string | null;
  activeTool: ToolId;
  mitigationAt: number | null;
  modifiers: SimulationModifiers;
  correlation: CorrelationContext;
  announcement: string;
}

export type SimulationEvent =
  | { type: "APPLY_SERVER_SNAPSHOT"; snapshot: Partial<SimulationState> }
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
  | { type: "PERFORM_ACTION"; action: ActionId }
  | { type: "UPDATE_ALERT"; alertId: string; action: AlertActionId }
  | {
      type: "CORRELATE";
      tool: ToolId;
      service?: string | null;
      traceId?: string | null;
      deploymentId?: string | null;
      timeRange?: CorrelationContext["timeRange"];
    };
