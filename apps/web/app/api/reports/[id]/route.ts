import { authenticatedOwnerId } from "@/lib/auth/owner";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import { getOwnedReport } from "@/lib/persistence/reports";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const report = await getOwnedReport(ownerId, `report_${(await params).id}`);
    return report
      ? Response.json(report.report)
      : Response.json(
          { error: { code: "NOT_FOUND", message: "Report not found." } },
          { status: 404 },
        );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
