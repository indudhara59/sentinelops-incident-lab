import { authenticatedOwnerId } from "@/lib/auth/owner";
import { getOwnedReport } from "@/lib/persistence/reports";

export function safeCsvCell(value: unknown): string {
  let text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  const id = (await params).id;
  const stored = await getOwnedReport(ownerId, `report_${id}`);
  if (!stored)
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Report not found." } },
      { status: 404 },
    );
  const format = new URL(request.url).searchParams.get("format");
  const filename = `sentinelops-midnight-latency-${id.slice(-8)}`;
  if (format === "json") {
    return new Response(JSON.stringify(stored.report, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}.json"`,
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (format === "csv") {
    const timeline = Array.isArray(stored.report.timeline)
      ? (stored.report.timeline as Array<Record<string, unknown>>)
      : [];
    const csv = [
      "second,kind,title,description",
      ...timeline.map((row) =>
        [row.second, row.kind, row.title, row.description]
          .map(safeCsvCell)
          .join(","),
      ),
    ].join("\r\n");
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}-timeline.csv"`,
        "x-content-type-options": "nosniff",
      },
    });
  }
  return Response.json(
    { error: { code: "INVALID_FORMAT", message: "Use json or csv." } },
    { status: 400 },
  );
}
