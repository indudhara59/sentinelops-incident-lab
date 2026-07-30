import type { ApiSnapshot, IncidentReport } from "@/lib/simulation/api-client";

export async function persistApiSnapshot(
  sessionId: string,
  snapshot: ApiSnapshot,
): Promise<"saved" | "not-saved"> {
  const response = await fetch("/api/incidents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId,
      scenarioId: snapshot.scenarioId ?? "scenario-midnight-latency-001",
      scenarioSlug: "midnight-latency-incident",
      scenarioTitle: "The Midnight Latency Incident",
      difficulty: "intermediate",
      status: snapshot.investigationCompleted
        ? "completed"
        : snapshot.status === "paused"
          ? "paused"
          : "active",
      scenarioVersion: snapshot.scenarioVersion ?? snapshot.version ?? "1",
      engineVersion: snapshot.engineVersion ?? "phase-6",
      seed: String(snapshot.seed ?? ""),
      simulationTimeMs: Number(snapshot.elapsedSeconds ?? 0) * 1_000,
      score: (snapshot.report as { score?: { total?: number } } | undefined)
        ?.score?.total,
      summaryTelemetry: summarizeMetrics(snapshot.metrics),
      importantTimeline: snapshot.timeline,
      actions: snapshot.actions,
      evidence: snapshot.collectedEvidence,
      hypotheses: snapshot.hypotheses,
      completedAt: snapshot.investigationCompleted
        ? new Date().toISOString()
        : undefined,
    }),
  });
  return response.ok ? "saved" : "not-saved";
}

function summarizeMetrics(value: unknown) {
  if (!Array.isArray(value)) return [];
  const points = value.slice(-120) as Array<Record<string, unknown>>;
  const metrics = [
    "orderLatencyMs",
    "checkoutErrorRate",
    "dbPoolUtilizationPercent",
  ];
  return metrics.map((metric) => ({
    metric,
    service:
      metric === "dbPoolUtilizationPercent" ? "orders-db" : "order-service",
    points: points.map((point) => ({
      timestamp: Number(point.second ?? 0),
      value: Number(point[metric] ?? 0),
    })),
  }));
}

export async function persistIncidentReport(
  report: IncidentReport,
): Promise<void> {
  await fetch("/api/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(report),
  });
}

export async function persistInitialApiSession(session: {
  id: string;
  snapshot: ApiSnapshot;
}): Promise<void> {
  await persistApiSnapshot(session.id, session.snapshot);
}
