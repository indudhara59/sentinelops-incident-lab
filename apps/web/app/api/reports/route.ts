import { authenticatedOwnerId } from "@/lib/auth/owner";
import { getOwnedIncident } from "@/lib/persistence/incidents";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import {
  COLLECTIONS,
  PERSISTENCE_LIMITS,
  boundText,
  isSafeIdentifier,
} from "@/lib/persistence/model";
import { getDatabase } from "@/lib/persistence/mongodb";

export async function POST(request: Request) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const report = (await request.json()) as Record<string, unknown>;
    const incidentId = report.sessionId;
    if (
      !isSafeIdentifier(incidentId) ||
      !(await getOwnedIncident(ownerId, incidentId))
    ) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Investigation not found." } },
        { status: 404 },
      );
    }
    const score = Math.max(
      0,
      Math.min(
        100,
        Number(
          (report.score as Record<string, unknown> | undefined)?.total ?? 0,
        ),
      ),
    );
    const now = new Date();
    const serialized = JSON.stringify(report);
    if (serialized.length > PERSISTENCE_LIMITS.reportText) {
      return Response.json(
        {
          error: {
            code: "REPORT_TOO_LARGE",
            message: "Report exceeds the saved-data limit.",
          },
        },
        { status: 413 },
      );
    }
    await (
      await getDatabase()
    )
      .collection<{ _id: string; ownerId: string; [key: string]: unknown }>(
        COLLECTIONS.incidentReports,
      )
      .updateOne(
        { _id: `report_${incidentId}`, ownerId },
        {
          $set: {
            incidentSessionId: incidentId,
            scenarioId: boundText(
              (report.scenario as Record<string, unknown> | undefined)?.id,
              100,
            ),
            scenarioTitle: boundText(
              (report.scenario as Record<string, unknown> | undefined)?.title,
              PERSISTENCE_LIMITS.title,
            ),
            score,
            summary: boundText(report.executiveSummary, 2_000),
            report,
            completedAt: now,
          },
          $setOnInsert: {
            _id: `report_${incidentId}`,
            ownerId,
            createdAt: now,
          },
        },
        { upsert: true },
      );
    return Response.json({ id: `report_${incidentId}` }, { status: 201 });
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
