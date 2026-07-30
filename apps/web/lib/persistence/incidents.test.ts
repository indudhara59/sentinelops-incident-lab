import { describe, expect, it } from "vitest";
import {
  normalizeIncidentListInput,
  ownedIncidentFilter,
  sanitizeIncidentSnapshot,
} from "./incidents";
import { PERSISTENCE_LIMITS } from "./model";

const sessionId = `sim_${"a".repeat(32)}`;

describe("owned incident persistence", () => {
  it("allowlists sorting, filters, and bounded pagination", () => {
    const input = normalizeIncidentListInput({
      status: '{"$ne":"completed"}',
      sort: "$where",
      page: -20,
      pageSize: 100_000,
      search: ".*",
    });
    expect(input.status).toBeUndefined();
    expect(input.sort).toBe("newest");
    expect(input.page).toBe(1);
    expect(input.pageSize).toBe(PERSISTENCE_LIMITS.maximumPageSize);
    const filter = ownedIncidentFilter("user-a", input);
    expect(filter.ownerId).toBe("user-a");
    expect(String(filter.scenarioTitle)).toBe("/\\.\\*/i");
  });

  it("always applies the immutable owner identity", () => {
    const queryA = ownedIncidentFilter(
      "user-a",
      normalizeIncidentListInput({}),
    );
    const queryB = ownedIncidentFilter(
      "user-b",
      normalizeIncidentListInput({}),
    );
    expect(queryA).toEqual({ ownerId: "user-a" });
    expect(queryB).toEqual({ ownerId: "user-b" });
    expect(queryA).not.toEqual(queryB);
  });

  it("bounds saved telemetry, actions, and timeline data", () => {
    const snapshot = sanitizeIncidentSnapshot("user-a", {
      sessionId,
      scenarioId: "scenario-midnight-latency-001",
      scenarioSlug: "midnight-latency-incident",
      scenarioTitle: "The Midnight Latency Incident",
      difficulty: "intermediate",
      status: "active",
      scenarioVersion: "1",
      engineVersion: "1",
      seed: "42",
      simulationTimeMs: 1_000,
      importantTimeline: Array.from({ length: 1_000 }, (_, index) => ({
        index,
      })),
      actions: Array.from({ length: 1_000 }, (_, index) => ({ index })),
      summaryTelemetry: Array.from({ length: 100 }, () => ({
        metric: "latency",
        service: "order",
        points: Array.from({ length: 300 }, (_, timestamp) => ({
          timestamp,
          value: timestamp,
        })),
      })),
    });
    expect(snapshot.ownerId).toBe("user-a");
    expect(snapshot.importantTimeline).toHaveLength(
      PERSISTENCE_LIMITS.timelineEvents,
    );
    expect(snapshot.actions).toHaveLength(PERSISTENCE_LIMITS.actions);
    expect(snapshot.summaryTelemetry).toHaveLength(
      PERSISTENCE_LIMITS.telemetrySeries,
    );
    expect(snapshot.summaryTelemetry[0]?.points).toHaveLength(
      PERSISTENCE_LIMITS.telemetryPointsPerSeries,
    );
  });
});
