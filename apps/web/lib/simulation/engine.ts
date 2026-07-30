import {
  actionDefinitions,
  evidenceCatalog,
  MAX_LOGS,
  MAX_METRICS,
  SIMULATION_INTERVAL_SECONDS,
  topology,
} from "./scenario";
import type {
  ActionId,
  Health,
  IncidentStage,
  LogEntry,
  MetricPoint,
  ServiceState,
  SimulationEvent,
  SimulationState,
  TimelineEntry,
} from "./types";

function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
export function seedFromSession(scenarioId: string, sessionId: string): number {
  return hash(`${scenarioId}:${sessionId}`);
}
function noise(seed: number, tick: number, salt: number): number {
  let x = seed ^ Math.imul(tick + 1, 0x9e3779b1) ^ salt;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967295;
}

export function stageFor(
  second: number,
  mitigationAt: number | null,
): IncidentStage {
  if (mitigationAt !== null) {
    const since = second - mitigationAt;
    if (since >= 120) return "Completed";
    if (since >= 60) return "Recovery";
    return "Incident mitigation";
  }
  if (second >= 150) return "Checkout errors";
  if (second >= 120) return "Order-service latency increase";
  if (second >= 90) return "Database pool saturation";
  if (second >= 60) return "Connection leak begins";
  if (second >= 30) return "Deployment completed";
  return "Normal";
}

function severity(stage: IncidentStage): number {
  return Math.max(
    0,
    [
      "Normal",
      "Deployment completed",
      "Connection leak begins",
      "Database pool saturation",
      "Order-service latency increase",
      "Checkout errors",
    ].indexOf(stage),
  );
}
function servicesFor(
  state: Pick<
    SimulationState,
    "stage" | "elapsedSeconds" | "seed" | "tick" | "modifiers"
  >,
): ServiceState[] {
  const level = severity(state.stage);
  const recovering =
    state.stage === "Incident mitigation" || state.stage === "Recovery";
  const completed = state.stage === "Completed";
  return topology.map((service, index) => {
    let health: Health = "healthy";
    if (service.id === "order" && level >= 3)
      health = level >= 5 ? "critical" : "degraded";
    if (service.id === "orders-db" && level >= 3)
      health = level >= 4 ? "critical" : "degraded";
    if (["web", "gateway", "cart"].includes(service.id) && level >= 5)
      health = "degraded";
    if (recovering && ["order", "orders-db", "gateway"].includes(service.id))
      health = "recovering";
    if (completed) health = "healthy";
    const jitter = Math.round(noise(state.seed, state.tick, index + 1) * 8);
    const affected = ["order", "orders-db"].includes(service.id);
    const latency = completed
      ? 90 + jitter
      : affected
        ? 90 + level * 470 - state.modifiers.latencyReduction + jitter
        : 55 + (level >= 5 ? 120 : 0) + jitter;
    const errors = completed
      ? 0.2
      : service.id === "order"
        ? Math.max(0.2, level * 2.7 - state.modifiers.errorReduction)
        : ["web", "gateway", "cart"].includes(service.id) && level >= 5
          ? 4.5
          : 0.2;
    return {
      ...service,
      dependencies: [...service.dependencies],
      health,
      requestsPerMinute: 780 + jitter * 3,
      errorRate: Number(errors.toFixed(1)),
      latencyMs: Math.max(20, Math.round(latency)),
    };
  });
}

function metricFor(state: SimulationState): MetricPoint {
  const level = severity(state.stage);
  const recoveryFactor =
    state.stage === "Recovery" ? 0.35 : state.stage === "Completed" ? 0 : 1;
  const jitter = Math.round(noise(state.seed, state.tick, 99) * 22);
  return {
    second: state.elapsedSeconds,
    orderLatencyMs: Math.max(
      80,
      Math.round(
        (95 + level * 480 - state.modifiers.latencyReduction) * recoveryFactor +
          jitter,
      ),
    ),
    checkoutErrorRate: Number(
      Math.max(
        0.1,
        (level >= 5
          ? 12.8 - state.modifiers.errorReduction
          : level >= 4
            ? 2.2
            : 0.2) * recoveryFactor,
      ).toFixed(1),
    ),
    dbPoolUsed: Math.min(
      40 + state.modifiers.poolBonus,
      Math.round((8 + level * 7) * recoveryFactor),
    ),
    dbPoolMax: 40 + state.modifiers.poolBonus,
  };
}
function logFor(state: SimulationState): LogEntry {
  const level = severity(state.stage);
  const messages =
    level >= 5
      ? ["ERROR", "checkout request failed after upstream timeout"]
      : level >= 4
        ? ["ERROR", "database connection acquisition timed out"]
        : level >= 3
          ? ["WARN", "database pool utilization above threshold"]
          : level >= 2
            ? ["WARN", "connection checkout duration increasing"]
            : [
                "INFO",
                level === 1
                  ? "order-service v2.14.7 deployment healthy"
                  : "request completed",
              ];
  return {
    id: `log-${state.tick}-${state.elapsedSeconds}`,
    second: state.elapsedSeconds,
    level: messages[0] as LogEntry["level"],
    service: level >= 2 ? "order" : "gateway",
    message: messages[1]!,
    fields: {
      request_id: `sim-${state.seed.toString(16)}-${state.tick}`,
      duration_ms: metricFor(state).orderLatencyMs,
    },
  };
}

const systemEvents: Record<
  IncidentStage,
  Omit<TimelineEntry, "id" | "second"> | undefined
> = {
  Normal: {
    kind: "system",
    title: "Incident simulation started",
    description: "Traffic and service health are within normal bounds.",
  },
  "Deployment completed": {
    kind: "system",
    title: "Deployment completed",
    description: "Order service version 2.14.7 finished a rolling deployment.",
  },
  "Connection leak begins": {
    kind: "system",
    title: "First latency increase",
    description: "Early order-service database wait time begins to rise.",
  },
  "Database pool saturation": {
    kind: "alert",
    title: "Database pool saturation",
    description:
      "Active orders database connections approach the configured ceiling.",
  },
  "Order-service latency increase": {
    kind: "alert",
    title: "Order-service latency alert",
    description: "The latency SLO burn alert is now active.",
  },
  "Checkout errors": {
    kind: "alert",
    title: "Checkout error-rate increase",
    description: "Customer checkout failures cross the critical threshold.",
  },
  "Incident mitigation": undefined,
  Recovery: {
    kind: "recovery",
    title: "Recovery signals detected",
    description: "Connection pressure and checkout latency are falling.",
  },
  Completed: {
    kind: "recovery",
    title: "Incident completed",
    description: "Simulated checkout health has returned to baseline.",
  },
};

function initialStateFromSeed(
  scenarioId: string,
  seed: number,
): SimulationState {
  const base: SimulationState = {
    scenarioId,
    seed,
    elapsedSeconds: 0,
    tick: 0,
    stage: "Normal",
    status: "ready",
    speed: 1,
    services: [],
    logs: [],
    metrics: [],
    timeline: [{ id: "timeline-start", second: 0, ...systemEvents.Normal! }],
    collectedEvidence: [],
    hypotheses: [],
    actions: [],
    notes: "",
    selectedServiceId: null,
    activeTool: "overview",
    mitigationAt: null,
    modifiers: {
      poolBonus: 0,
      latencyReduction: 0,
      errorReduction: 0,
      consumerPaused: false,
    },
    announcement: "",
  };
  return { ...base, services: servicesFor(base), metrics: [metricFor(base)] };
}
export function createInitialState(
  scenarioId: string,
  sessionId: string,
): SimulationState {
  return initialStateFromSeed(
    scenarioId,
    seedFromSession(scenarioId, sessionId),
  );
}

export function advanceSimulation(state: SimulationState): SimulationState {
  if (state.status === "completed") return state;
  const elapsedSeconds = state.elapsedSeconds + SIMULATION_INTERVAL_SECONDS;
  const tick = state.tick + 1;
  const stage = stageFor(elapsedSeconds, state.mitigationAt);
  const draft = { ...state, elapsedSeconds, tick, stage };
  const changed = stage !== state.stage;
  const event = changed ? systemEvents[stage] : undefined;
  const next: SimulationState = {
    ...draft,
    status: stage === "Completed" ? "completed" : state.status,
    services: servicesFor(draft),
    metrics: [...state.metrics, metricFor(draft)].slice(-MAX_METRICS),
    logs: [...state.logs, logFor(draft)].slice(-MAX_LOGS),
    timeline: event
      ? [
          ...state.timeline,
          { id: `timeline-${tick}-${stage}`, second: elapsedSeconds, ...event },
        ]
      : state.timeline,
    announcement: event?.kind === "alert" ? event.title : "",
  };
  return next;
}

function performAction(
  state: SimulationState,
  action: ActionId,
): SimulationState {
  const definition = actionDefinitions[action];
  const id = `action-${state.tick}-${state.actions.length + 1}`;
  let mitigationAt = state.mitigationAt;
  const modifiers = { ...state.modifiers };
  let effect =
    "Observation interval recorded; simulation state continues unchanged.";
  if (action === "rollback") {
    mitigationAt = state.elapsedSeconds;
    effect =
      "Rollback initiated; the simulation enters mitigation and recovery can begin.";
  }
  if (action === "increase-pool") {
    modifiers.poolBonus += 10;
    modifiers.latencyReduction += 300;
    effect =
      "Pool ceiling increases temporarily, reducing wait pressure without removing the underlying cause.";
  }
  if (action === "scale") {
    modifiers.latencyReduction += 180;
    effect = "Additional order-service capacity temporarily lowers latency.";
  }
  if (action === "disable-retry") {
    modifiers.errorReduction += 2;
    effect = "Retry amplification falls, reducing simulated error pressure.";
  }
  if (action === "pause-consumer") {
    modifiers.consumerPaused = true;
    effect =
      "Message consumption pauses and notification backlog begins to accumulate.";
  }
  if (action === "restart") {
    modifiers.latencyReduction += 120;
    effect =
      "An order-service instance restarts; symptoms ease briefly but may return.";
  }
  const entry = {
    id,
    action,
    label: definition.label,
    second: state.elapsedSeconds,
    risk: definition.risk,
    effect,
  };
  const stage =
    mitigationAt !== state.mitigationAt ? "Incident mitigation" : state.stage;
  return {
    ...state,
    mitigationAt,
    modifiers,
    stage,
    services: servicesFor({ ...state, modifiers, stage }),
    actions: [...state.actions, entry],
    timeline: [
      ...state.timeline,
      {
        id: `timeline-${id}`,
        second: state.elapsedSeconds,
        kind: "action",
        title: definition.label,
        description: effect,
      },
    ],
    announcement: `${definition.label} recorded. ${effect}`,
  };
}

export function simulationReducer(
  state: SimulationState,
  event: SimulationEvent,
): SimulationState {
  switch (event.type) {
    case "START":
      return state.status === "ready" ? { ...state, status: "running" } : state;
    case "PAUSE":
      return state.status === "running"
        ? { ...state, status: "paused" }
        : state;
    case "RESUME":
      return state.status === "paused"
        ? { ...state, status: "running" }
        : state;
    case "ADVANCE":
      return advanceSimulation(state);
    case "RESET":
      return initialStateFromSeed(state.scenarioId, state.seed);
    case "SET_SPEED":
      return { ...state, speed: event.speed };
    case "SELECT_SERVICE":
      return { ...state, selectedServiceId: event.serviceId };
    case "SET_TOOL":
      return { ...state, activeTool: event.tool };
    case "SET_NOTES":
      return { ...state, notes: event.notes };
    case "COLLECT_EVIDENCE":
      if (state.collectedEvidence.some(({ id }) => id === event.evidence.id))
        return state;
      return {
        ...state,
        collectedEvidence: [
          ...state.collectedEvidence,
          { ...event.evidence, annotation: "", hypothesisIds: [] },
        ],
        announcement: `Evidence collected from ${event.evidence.source}.`,
      };
    case "ANNOTATE_EVIDENCE":
      return {
        ...state,
        collectedEvidence: state.collectedEvidence.map((item) =>
          item.id === event.evidenceId
            ? { ...item, annotation: event.annotation }
            : item,
        ),
      };
    case "CREATE_HYPOTHESIS": {
      const hypothesis = {
        id: `hyp-${state.hypotheses.length + 1}`,
        title: event.title,
        notes: event.notes,
        status: "unresolved" as const,
        evidenceIds: [],
      };
      return { ...state, hypotheses: [...state.hypotheses, hypothesis] };
    }
    case "SET_HYPOTHESIS_STATUS":
      return {
        ...state,
        hypotheses: state.hypotheses.map((item) =>
          item.id === event.hypothesisId
            ? { ...item, status: event.status }
            : item,
        ),
      };
    case "ATTACH_EVIDENCE":
      return {
        ...state,
        hypotheses: state.hypotheses.map((item) =>
          item.id === event.hypothesisId &&
          !item.evidenceIds.includes(event.evidenceId)
            ? { ...item, evidenceIds: [...item.evidenceIds, event.evidenceId] }
            : item,
        ),
        collectedEvidence: state.collectedEvidence.map((item) =>
          item.id === event.evidenceId &&
          !item.hypothesisIds.includes(event.hypothesisId)
            ? {
                ...item,
                hypothesisIds: [...item.hypothesisIds, event.hypothesisId],
              }
            : item,
        ),
      };
    case "PERFORM_ACTION":
      return performAction(state, event.action);
  }
}

export function availableEvidence(state: SimulationState) {
  return evidenceCatalog.filter(
    (item) => item.availableAt <= state.elapsedSeconds,
  );
}
export function canRevealConclusion(state: SimulationState): boolean {
  const ids = new Set(state.collectedEvidence.map(({ id }) => id));
  return (
    state.stage === "Completed" ||
    [
      "ev-deploy-2147",
      "ev-metric-pool",
      "ev-log-timeout",
      "ev-trace-wait",
    ].every((id) => ids.has(id))
  );
}

export function playerVisibleStage(state: SimulationState): string {
  if (state.stage === "Connection leak begins" && !canRevealConclusion(state))
    return "Early anomaly developing";
  return state.stage;
}
