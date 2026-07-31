import { describe, expect, it } from "vitest";
import { persistenceIndexPlan } from "./indexes";
import { COLLECTIONS } from "./model";

describe("persistence indexes", () => {
  it("indexes ownership, stable pagination, status, scenario, completion, and TTL", () => {
    const plan = persistenceIndexPlan();
    const incidents = plan[COLLECTIONS.incidentSessions] ?? [];
    const serialized = JSON.stringify(incidents);
    expect(serialized).toContain("ownerId");
    expect(serialized).toContain("status");
    expect(serialized).toContain("scenarioId");
    expect(serialized).toContain("createdAt");
    expect(serialized).toContain("completedAt");
    expect(serialized).toContain("expireAfterSeconds");
  });

  it("creates unique owner-scoped indexes for child records", () => {
    const plan = persistenceIndexPlan();
    for (const name of [
      COLLECTIONS.incidentReports,
      COLLECTIONS.evidenceItems,
      COLLECTIONS.hypotheses,
      COLLECTIONS.savedScenarios,
      COLLECTIONS.userPreferences,
      COLLECTIONS.learningProgress,
    ]) {
      expect(plan[name]?.some((index) => index.unique)).toBe(true);
    }
  });
});
