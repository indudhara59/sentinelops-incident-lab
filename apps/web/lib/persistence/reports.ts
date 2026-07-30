import "server-only";
import type { IncidentReportDocument } from "./model";
import { COLLECTIONS, isSafeIdentifier } from "./model";
import { getDatabase } from "./mongodb";

export async function listOwnedReports(ownerId: string, limit = 20) {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  return (await getDatabase())
    .collection<IncidentReportDocument>(COLLECTIONS.incidentReports)
    .find({ ownerId })
    .sort({ completedAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();
}

export async function getOwnedReport(ownerId: string, id: string) {
  if (!isSafeIdentifier(id)) return null;
  return (await getDatabase())
    .collection<IncidentReportDocument>(COLLECTIONS.incidentReports)
    .findOne({ _id: id, ownerId });
}

export async function dashboardSummary(ownerId: string) {
  const collection = (await getDatabase()).collection(
    COLLECTIONS.incidentSessions,
  );
  const [summary] = await collection
    .aggregate<{
      total: number;
      completed: number;
      averageScore: number | null;
      scenarios: string[];
    }>([
      { $match: { ownerId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          averageScore: { $avg: "$score" },
          scenarios: { $addToSet: "$scenarioId" },
        },
      },
    ])
    .toArray();
  return {
    total: summary?.total ?? 0,
    completed: summary?.completed ?? 0,
    averageScore:
      summary?.averageScore == null ? null : Math.round(summary.averageScore),
    scenariosAttempted: summary?.scenarios.length ?? 0,
  };
}

export function reportInvestigationAreas(
  report: IncidentReportDocument | undefined,
) {
  const score = report?.report.score as
    { breakdown?: Array<Record<string, unknown>> } | undefined;
  const breakdown = Array.isArray(score?.breakdown) ? score.breakdown : [];
  const ranked = breakdown
    .map((item) => ({
      category:
        typeof item.category === "string"
          ? item.category
          : "Investigation practice",
      ratio: Math.max(
        0,
        Math.min(
          1,
          Number(item.score ?? 0) / Math.max(1, Number(item.maximum ?? 1)),
        ),
      ),
    }))
    .sort(
      (left, right) =>
        right.ratio - left.ratio || left.category.localeCompare(right.category),
    );
  return {
    strongest: ranked[0]?.category ?? null,
    improvement: ranked.at(-1)?.category ?? null,
  };
}
