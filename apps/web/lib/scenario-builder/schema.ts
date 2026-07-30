export const BUILDER_LIMITS = {
  services: 20,
  dependencies: 60,
  events: 80,
  metrics: 20,
  logs: 30,
  traces: 20,
  alerts: 30,
  evidence: 50,
  hypotheses: 20,
  objectives: 12,
  text: 2_000,
} as const;

export const EVENT_TYPES = [
  "stage",
  "deployment",
  "signal-change",
  "alert",
] as const;
export const ACTION_TYPES = [
  "restart",
  "scale",
  "rollback",
  "increase-pool",
  "disable-retry",
  "pause-consumer",
  "observe",
] as const;
export const METRIC_TYPES = [
  "request-rate",
  "error-rate",
  "latency",
  "cpu",
  "memory",
  "connections",
  "queue-depth",
  "restarts",
] as const;
export const PATTERN_TYPES = [
  "constant",
  "linear-rise",
  "linear-fall",
  "step",
  "recovery",
] as const;

export type ScenarioDraft = {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  services: Array<{
    id: string;
    name: string;
    type: string;
    dependencies: string[];
  }>;
  initialConditions: Array<{ metric: string; value: number }>;
  timelineEvents: Array<{
    id: string;
    atSeconds: number;
    type: (typeof EVENT_TYPES)[number];
    title: string;
  }>;
  metricPatterns: Array<{
    id: string;
    metric: (typeof METRIC_TYPES)[number];
    serviceId: string;
    pattern: (typeof PATTERN_TYPES)[number];
    start: number;
    end: number;
    min: number;
    max: number;
  }>;
  logTemplates: Array<{
    id: string;
    serviceId: string;
    severity: "INFO" | "WARN" | "ERROR";
    message: string;
    atSeconds: number;
  }>;
  traceTemplates: Array<{
    id: string;
    rootServiceId: string;
    targetServiceId: string;
    operation: string;
    baseDurationMs: number;
  }>;
  alerts: Array<{
    id: string;
    serviceId: string;
    metric: (typeof METRIC_TYPES)[number];
    operator: "gt" | "lt";
    threshold: number;
    severity: "warning" | "critical";
  }>;
  hiddenRootCause: {
    affectedServiceId: string;
    mechanism: string;
    triggeringEventId: string;
    summary: string;
  };
  evidence: Array<{
    id: string;
    source: "Logs" | "Metrics" | "Traces" | "Deployments" | "Alerts";
    serviceId: string;
    atSeconds: number;
    summary: string;
  }>;
  hypotheses: Array<{ id: string; title: string }>;
  allowedActions: Array<{
    type: (typeof ACTION_TYPES)[number];
    effect: "correct" | "temporary" | "risky" | "observe";
  }>;
  recoveryConditions: Array<{
    metric: (typeof METRIC_TYPES)[number];
    operator: "lt" | "gt";
    value: number;
    stableIntervals: number;
  }>;
  scoringWeights: Record<string, number>;
  learningObjectives: string[];
};

export type ValidationIssue = { path: string; code: string; message: string };

export function hasScenarioDraftShape(value: unknown): value is ScenarioDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<ScenarioDraft>;
  return (
    typeof draft.title === "string" &&
    typeof draft.description === "string" &&
    ["Beginner", "Intermediate", "Advanced"].includes(
      String(draft.difficulty),
    ) &&
    [
      draft.services,
      draft.initialConditions,
      draft.timelineEvents,
      draft.metricPatterns,
      draft.logTemplates,
      draft.traceTemplates,
      draft.alerts,
      draft.evidence,
      draft.hypotheses,
      draft.allowedActions,
      draft.recoveryConditions,
      draft.learningObjectives,
    ].every(Array.isArray) &&
    Boolean(
      draft.hiddenRootCause && typeof draft.hiddenRootCause === "object",
    ) &&
    Boolean(draft.scoringWeights && typeof draft.scoringWeights === "object")
  );
}

const identifier = /^[a-z][a-z0-9-]{1,63}$/;
const unsafeContent =
  /(https?:\/\/|www\.|\b(?:api[_-]?key|password|secret|token|credential)s?\b|\$\{|{{|}}|<%|%>|\b(?:eval|exec|subprocess|child_process|os\.system|fetch\s*\(|XMLHttpRequest|curl\s|wget\s|ssh\s)\b|(?:\b[a-z0-9-]+\.)+(?:com|net|org|io|dev|cloud)\b)/i;

export function validateScenarioDraft(value: ScenarioDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  scanUnsafeFields(value, "", issues);
  const text = (path: string, input: string, required = true) => {
    if (required && !input.trim())
      issues.push({
        path,
        code: "required",
        message: "This field is required.",
      });
    if (input.length > BUILDER_LIMITS.text)
      issues.push({
        path,
        code: "oversized",
        message: "Content exceeds the safe size limit.",
      });
    if (unsafeContent.test(input))
      issues.push({
        path,
        code: "unsafe-content",
        message:
          "URLs, credentials, code, commands, and template expressions are not allowed.",
      });
  };
  text("title", value.title);
  text("description", value.description);
  text("hiddenRootCause.summary", value.hiddenRootCause.summary);
  if (
    !value.hiddenRootCause.mechanism.trim() ||
    !identifier.test(value.hiddenRootCause.mechanism)
  )
    issues.push({
      path: "hiddenRootCause.mechanism",
      code: "missing-root-cause",
      message: "A declarative root-cause mechanism ID is required.",
    });
  const bounded = (path: string, length: number, maximum: number) => {
    if (length > maximum)
      issues.push({
        path,
        code: "too-many",
        message: `At most ${maximum} items are allowed.`,
      });
  };
  bounded("services", value.services.length, BUILDER_LIMITS.services);
  bounded("timelineEvents", value.timelineEvents.length, BUILDER_LIMITS.events);
  bounded(
    "metricPatterns",
    value.metricPatterns.length,
    BUILDER_LIMITS.metrics,
  );
  bounded("logTemplates", value.logTemplates.length, BUILDER_LIMITS.logs);
  bounded("traceTemplates", value.traceTemplates.length, BUILDER_LIMITS.traces);
  bounded("alerts", value.alerts.length, BUILDER_LIMITS.alerts);
  bounded("evidence", value.evidence.length, BUILDER_LIMITS.evidence);
  bounded("hypotheses", value.hypotheses.length, BUILDER_LIMITS.hypotheses);
  bounded(
    "learningObjectives",
    value.learningObjectives.length,
    BUILDER_LIMITS.objectives,
  );
  const serviceIds = new Set(value.services.map((service) => service.id));
  if (serviceIds.size !== value.services.length)
    issues.push({
      path: "services",
      code: "duplicate-id",
      message: "Service IDs must be unique.",
    });
  bounded(
    "dependencies",
    value.services.reduce(
      (total, service) => total + service.dependencies.length,
      0,
    ),
    BUILDER_LIMITS.dependencies,
  );
  if (!value.services.length)
    issues.push({
      path: "services",
      code: "required",
      message: "Add at least one service.",
    });
  for (const [index, service] of value.services.entries()) {
    if (!identifier.test(service.id))
      issues.push({
        path: `services.${index}.id`,
        code: "invalid-id",
        message: "Use lowercase letters, numbers, and hyphens.",
      });
    text(`services.${index}.name`, service.name);
    for (const dependency of service.dependencies)
      if (!serviceIds.has(dependency) || dependency === service.id)
        issues.push({
          path: `services.${index}.dependencies`,
          code: "invalid-dependency",
          message: "Dependencies must reference another declared service.",
        });
  }
  if (hasCycle(value.services))
    issues.push({
      path: "services",
      code: "cyclic-dependency",
      message: "Service dependencies must be acyclic.",
    });
  const times = value.timelineEvents.map((event) => event.atSeconds);
  if (value.timelineEvents.some((event) => !EVENT_TYPES.includes(event.type)))
    issues.push({
      path: "timelineEvents",
      code: "invalid-event-type",
      message: "Timeline event type is not allowlisted.",
    });
  if (
    !times.includes(0) ||
    times.some((time) => time < 0 || time > 7_200) ||
    times.some((time, index) => index > 0 && time <= times[index - 1]!)
  )
    issues.push({
      path: "timelineEvents",
      code: "unreachable-stage",
      message: "Timeline must start at zero and increase to reachable times.",
    });
  const eventIds = new Set(value.timelineEvents.map((event) => event.id));
  if (!eventIds.has(value.hiddenRootCause.triggeringEventId))
    issues.push({
      path: "hiddenRootCause.triggeringEventId",
      code: "invalid-trigger",
      message: "Root cause must reference a timeline event.",
    });
  if (!serviceIds.has(value.hiddenRootCause.affectedServiceId))
    issues.push({
      path: "hiddenRootCause.affectedServiceId",
      code: "invalid-service",
      message: "Root cause must reference a service.",
    });
  for (const [index, metric] of value.metricPatterns.entries()) {
    if (
      !METRIC_TYPES.includes(metric.metric) ||
      !PATTERN_TYPES.includes(metric.pattern)
    )
      issues.push({
        path: `metricPatterns.${index}`,
        code: "invalid-pattern-type",
        message: "Metric and pattern types must be allowlisted.",
      });
    if (!serviceIds.has(metric.serviceId))
      issues.push({
        path: `metricPatterns.${index}.serviceId`,
        code: "invalid-service",
        message: "Metric service is invalid.",
      });
    if (
      ![metric.start, metric.end, metric.min, metric.max].every(
        Number.isFinite,
      ) ||
      metric.min > metric.max ||
      metric.start < metric.min ||
      metric.start > metric.max ||
      metric.end < metric.min ||
      metric.end > metric.max ||
      Math.abs(metric.max) > 1_000_000
    )
      issues.push({
        path: `metricPatterns.${index}`,
        code: "invalid-range",
        message:
          "Metric values must be finite and remain inside the declared range.",
      });
  }
  for (const [index, log] of value.logTemplates.entries()) {
    text(`logTemplates.${index}.message`, log.message);
    if (!serviceIds.has(log.serviceId))
      issues.push({
        path: `logTemplates.${index}.serviceId`,
        code: "invalid-service",
        message: "Log service is invalid.",
      });
    if (/\{(?!service\})[^}]*\}/.test(log.message))
      issues.push({
        path: `logTemplates.${index}.message`,
        code: "unsafe-template",
        message: "Only the inert {service} placeholder is allowed.",
      });
  }
  for (const [index, trace] of value.traceTemplates.entries())
    if (
      !serviceIds.has(trace.rootServiceId) ||
      !serviceIds.has(trace.targetServiceId) ||
      !Number.isFinite(trace.baseDurationMs) ||
      trace.baseDurationMs < 1 ||
      trace.baseDurationMs > 60_000
    )
      issues.push({
        path: `traceTemplates.${index}`,
        code: "invalid-trace",
        message: "Trace services and duration must be bounded.",
      });
  for (const [index, alert] of value.alerts.entries())
    if (!serviceIds.has(alert.serviceId) || !Number.isFinite(alert.threshold))
      issues.push({
        path: `alerts.${index}`,
        code: "invalid-alert",
        message: "Alert service and threshold must be valid.",
      });
  for (const [index, evidence] of value.evidence.entries())
    if (
      !serviceIds.has(evidence.serviceId) ||
      evidence.atSeconds < 0 ||
      evidence.atSeconds > 7_200
    )
      issues.push({
        path: `evidence.${index}`,
        code: "invalid-evidence",
        message: "Evidence must reference a service and reachable time.",
      });
  if (!value.evidence.length)
    issues.push({
      path: "evidence",
      code: "missing-evidence",
      message: "Add evidence supporting investigation.",
    });
  if (!value.allowedActions.some((action) => action.effect === "correct"))
    issues.push({
      path: "allowedActions",
      code: "no-recovery-action",
      message: "At least one allowlisted action must recover the incident.",
    });
  if (
    value.allowedActions.some((action) => !ACTION_TYPES.includes(action.type))
  )
    issues.push({
      path: "allowedActions",
      code: "invalid-action",
      message: "Action type is not allowlisted.",
    });
  if (
    !value.recoveryConditions.length ||
    value.recoveryConditions.some(
      (condition) =>
        !Number.isFinite(condition.value) ||
        condition.stableIntervals < 2 ||
        condition.stableIntervals > 10,
    )
  )
    issues.push({
      path: "recoveryConditions",
      code: "impossible-recovery",
      message: "Recovery needs finite thresholds and 2–10 stable intervals.",
    });
  const total = Object.values(value.scoringWeights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  if (
    total !== 100 ||
    Object.values(value.scoringWeights).some(
      (weight) => !Number.isInteger(weight) || weight < 0 || weight > 100,
    )
  )
    issues.push({
      path: "scoringWeights",
      code: "invalid-score-total",
      message: "Integer scoring weights must total 100.",
    });
  return issues;
}

function scanUnsafeFields(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === "string") {
    if (unsafeContent.test(value))
      issues.push({
        path: path || "definition",
        code: "unsafe-content",
        message:
          "URLs, credentials, code, commands, hostnames, and executable templates are not allowed.",
      });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanUnsafeFields(item, `${path}.${index}`, issues),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    const itemPath = path ? `${path}.${key}` : key;
    const keyTokens = key
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase()
      .split(/[^a-z0-9]+/);
    if (
      keyTokens.some((token) =>
        [
          "url",
          "uri",
          "hostname",
          "host",
          "network",
          "socket",
          "command",
          "shell",
          "script",
          "code",
          "regex",
          "regexp",
          "file",
          "path",
          "credential",
          "secret",
          "token",
          "password",
        ].includes(token),
      )
    )
      issues.push({
        path: itemPath,
        code: "forbidden-field",
        message:
          "Network, code, command, file, credential, and regular-expression fields are forbidden.",
      });
    scanUnsafeFields(item, itemPath, issues);
  }
}

function hasCycle(services: ScenarioDraft["services"]): boolean {
  const graph = new Map(
    services.map((service) => [service.id, service.dependencies]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((graph.get(id) ?? []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return services.some((service) => visit(service.id));
}

function previewNoise(seed: number, index: number) {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0xffffffff;
}

export function generateScenarioPreview(draft: ScenarioDraft, seed = 1) {
  if (validateScenarioDraft(draft).length)
    throw new Error("Scenario must pass validation before preview.");
  const timestamps = Array.from({ length: 8 }, (_, index) => index * 30);
  return {
    seed,
    private: true as const,
    topology: draft.services,
    timeline: draft.timelineEvents,
    metrics: draft.metricPatterns.map((pattern, patternIndex) => ({
      id: pattern.id,
      serviceId: pattern.serviceId,
      metric: pattern.metric,
      points: timestamps.map((second, index) => ({
        second,
        value: Number(
          (
            pattern.start +
            (pattern.end - pattern.start) * (index / (timestamps.length - 1)) +
            previewNoise(seed, patternIndex * 20 + index) *
              Math.min(1, (pattern.max - pattern.min) * 0.01)
          ).toFixed(2),
        ),
      })),
    })),
    logs: draft.logTemplates.slice(0, 10).map((log) => ({
      ...log,
      simulated: true,
      message: log.message.replaceAll("{service}", log.serviceId),
    })),
    traces: draft.traceTemplates.slice(0, 10).map((trace, index) => ({
      ...trace,
      durationMs:
        trace.baseDurationMs + Math.round(previewNoise(seed, index + 200) * 20),
      simulated: true,
    })),
  };
}

export const EMPTY_SCENARIO_DRAFT: ScenarioDraft = {
  title: "",
  description: "",
  difficulty: "Intermediate",
  services: [],
  initialConditions: [],
  timelineEvents: [
    { id: "start", atSeconds: 0, type: "stage", title: "Normal" },
  ],
  metricPatterns: [],
  logTemplates: [],
  traceTemplates: [],
  alerts: [],
  hiddenRootCause: {
    affectedServiceId: "",
    mechanism: "",
    triggeringEventId: "start",
    summary: "",
  },
  evidence: [],
  hypotheses: [],
  allowedActions: [{ type: "observe", effect: "observe" }],
  recoveryConditions: [],
  scoringWeights: {
    investigation: 30,
    evidence: 30,
    mitigation: 20,
    recovery: 20,
  },
  learningObjectives: [],
};
