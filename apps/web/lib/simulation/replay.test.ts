import { describe, expect, it } from "vitest";
import type { IncidentReport } from "./api-client";
import {
  CLIENT_ENGINE_VERSION,
  MIDNIGHT_SCENARIO_VERSION,
  replayReport,
} from "./replay";

function report(overrides?: Partial<IncidentReport["replay"]>): IncidentReport {
  return {
    schemaVersion: "sentinelops-report@1.0.0",
    sessionId: "sim_test",
    scenario: {
      id: "scenario-midnight-latency-001",
      slug: "midnight-latency-incident",
      title: "The Midnight Latency Incident",
      version: MIDNIGHT_SCENARIO_VERSION,
    },
    engineVersion: CLIENT_ENGINE_VERSION,
    seed: 42,
    executiveSummary: "Summary",
    customerImpact: "Impact",
    timeline: [],
    alerts: [],
    evidence: [],
    hypotheses: [],
    rootCause: "Sealed until this report exists.",
    contributingFactors: [],
    actions: [],
    recoveryVerification: { verified: true, checks: {} },
    score: { total: 80, maximum: 100, breakdown: [] },
    missedEvidence: [],
    betterInvestigationPath: [],
    lessonsLearned: [],
    followUpActions: [],
    replay: {
      scenarioVersion: MIDNIGHT_SCENARIO_VERSION,
      engineVersion: CLIENT_ENGINE_VERSION,
      seed: 42,
      actions: [{ action: "rollback", second: 150 }],
      ...overrides,
    },
    disclaimer: "Educational report.",
  };
}

describe("deterministic report replay", () => {
  it("reconstructs recorded actions from seed and timestamps", () => {
    const replay = replayReport(report());
    expect(replay.exact).toBe(true);
    expect(replay.warning).toBeNull();
    expect(replay.state.seed).toBe(42);
    expect(replay.state.elapsedSeconds).toBe(150);
    expect(replay.state.actions[0]?.action).toBe("rollback");
  });

  it("warns when an exact versioned replay is impossible", () => {
    const replay = replayReport(report({ engineVersion: "future-engine@2" }));
    expect(replay.exact).toBe(false);
    expect(replay.warning).toMatch(/version differs/i);
  });
});
