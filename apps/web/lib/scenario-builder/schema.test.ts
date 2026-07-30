import { describe, expect, it } from "vitest";
import {
  ACTION_TYPES,
  generateScenarioPreview,
  validateScenarioDraft,
  type ScenarioDraft,
} from "./schema";

export function validDraft(): ScenarioDraft {
  return {
    title: "Private queue practice",
    description: "A fictional bounded queue incident.",
    difficulty: "Intermediate",
    services: [
      { id: "api", name: "API", type: "Application", dependencies: ["queue"] },
      { id: "queue", name: "Queue", type: "Message queue", dependencies: [] },
    ],
    initialConditions: [{ metric: "queue-depth", value: 10 }],
    timelineEvents: [
      { id: "start", atSeconds: 0, type: "stage", title: "Normal" },
      {
        id: "slowdown",
        atSeconds: 30,
        type: "signal-change",
        title: "Consumer slows",
      },
    ],
    metricPatterns: [
      {
        id: "depth",
        metric: "queue-depth",
        serviceId: "queue",
        pattern: "linear-rise",
        start: 10,
        end: 90,
        min: 0,
        max: 100,
      },
    ],
    logTemplates: [
      {
        id: "lag-log",
        serviceId: "api",
        severity: "WARN",
        message: "Simulated queue lag rising",
        atSeconds: 30,
      },
    ],
    traceTemplates: [
      {
        id: "trace",
        rootServiceId: "api",
        targetServiceId: "queue",
        operation: "publish",
        baseDurationMs: 80,
      },
    ],
    alerts: [
      {
        id: "lag-alert",
        serviceId: "queue",
        metric: "queue-depth",
        operator: "gt",
        threshold: 80,
        severity: "critical",
      },
    ],
    hiddenRootCause: {
      affectedServiceId: "queue",
      mechanism: "consumer-slowdown",
      triggeringEventId: "slowdown",
      summary: "A fictional consumer slowdown grows the queue.",
    },
    evidence: [
      {
        id: "depth-evidence",
        source: "Metrics",
        serviceId: "queue",
        atSeconds: 60,
        summary: "Depth rises while publish rate is stable.",
      },
    ],
    hypotheses: [
      { id: "consumer-hypothesis", title: "Consumer processing slowed" },
    ],
    allowedActions: [
      { type: "scale", effect: "correct" },
      { type: "observe", effect: "observe" },
    ],
    recoveryConditions: [
      { metric: "queue-depth", operator: "lt", value: 30, stableIntervals: 3 },
    ],
    scoringWeights: {
      investigation: 30,
      evidence: 30,
      mitigation: 20,
      recovery: 20,
    },
    learningObjectives: ["Correlate queue depth and consumer throughput"],
  };
}

describe("declarative scenario builder safety", () => {
  it("accepts a bounded declarative scenario and deterministic preview", () => {
    const draft = validDraft();
    expect(validateScenarioDraft(draft)).toEqual([]);
    expect(generateScenarioPreview(draft, 42)).toEqual(
      generateScenarioPreview(draft, 42),
    );
    expect(generateScenarioPreview(draft, 42)).not.toEqual(
      generateScenarioPreview(draft, 43),
    );
  });

  it("exposes only allowlisted simulated actions", () => {
    expect(ACTION_TYPES).not.toContain("shell" as never);
    expect(ACTION_TYPES).not.toContain("network-request" as never);
  });

  it.each([
    [
      "code",
      (draft: ScenarioDraft) => {
        draft.logTemplates[0]!.message = "${eval(payload)}";
      },
      "unsafe-content",
    ],
    [
      "network",
      (draft: ScenarioDraft) => {
        draft.description = "Send to https://example.com";
      },
      "unsafe-content",
    ],
    [
      "network field",
      (draft: ScenarioDraft) => {
        Object.assign(draft, { destinationUrl: "internal" });
      },
      "forbidden-field",
    ],
    [
      "code field",
      (draft: ScenarioDraft) => {
        Object.assign(draft, { pythonCode: "print(1)" });
      },
      "forbidden-field",
    ],
    [
      "credentials",
      (draft: ScenarioDraft) => {
        draft.description = "password=demo";
      },
      "unsafe-content",
    ],
    [
      "cycle",
      (draft: ScenarioDraft) => {
        draft.services[1]!.dependencies = ["api"];
      },
      "cyclic-dependency",
    ],
    [
      "root cause",
      (draft: ScenarioDraft) => {
        draft.hiddenRootCause.mechanism = "";
      },
      "missing-root-cause",
    ],
    [
      "recovery action",
      (draft: ScenarioDraft) => {
        draft.allowedActions = [{ type: "observe", effect: "observe" }];
      },
      "no-recovery-action",
    ],
    [
      "stage",
      (draft: ScenarioDraft) => {
        draft.timelineEvents[1]!.atSeconds = 0;
      },
      "unreachable-stage",
    ],
    [
      "metric",
      (draft: ScenarioDraft) => {
        draft.metricPatterns[0]!.end = 200;
      },
      "invalid-range",
    ],
    [
      "evidence",
      (draft: ScenarioDraft) => {
        draft.evidence = [];
      },
      "missing-evidence",
    ],
    [
      "score",
      (draft: ScenarioDraft) => {
        draft.scoringWeights.recovery = 19;
      },
      "invalid-score-total",
    ],
    [
      "recovery",
      (draft: ScenarioDraft) => {
        draft.recoveryConditions[0]!.stableIntervals = 1;
      },
      "impossible-recovery",
    ],
  ])("rejects unsafe or invalid %s definitions", (_, mutate, code) => {
    const draft = validDraft();
    mutate(draft);
    expect(
      validateScenarioDraft(draft).some((issue) => issue.code === code),
    ).toBe(true);
  });

  it("bounds event counts and content size", () => {
    const draft = validDraft();
    draft.timelineEvents = Array.from({ length: 81 }, (_, index) => ({
      id: `event-${index}`,
      atSeconds: index,
      type: "stage" as const,
      title: "x",
    }));
    draft.description = "x".repeat(2_001);
    const codes = validateScenarioDraft(draft).map((issue) => issue.code);
    expect(codes).toContain("too-many");
    expect(codes).toContain("oversized");
  });
});
