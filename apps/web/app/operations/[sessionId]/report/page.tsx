import { IncidentReportPage } from "@/components/operations/incident-report";
import { isValidLocalSessionId } from "@/lib/local-session";
import { notFound } from "next/navigation";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  if (!isValidLocalSessionId(sessionId)) notFound();
  return <IncidentReportPage sessionId={sessionId} />;
}
