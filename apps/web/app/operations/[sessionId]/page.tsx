import { OperationsWorkspace } from "@/components/operations/workspace";
import { getScenarioBySlug } from "@/data/scenarios";
import { isValidLocalSessionId } from "@/lib/local-session";
import { notFound } from "next/navigation";

export default async function OperationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ scenario?: string }>;
}) {
  const [{ sessionId }, { scenario: slug }] = await Promise.all([
    params,
    searchParams,
  ]);
  const scenario = slug ? getScenarioBySlug(slug) : undefined;
  if (
    !isValidLocalSessionId(sessionId) ||
    !scenario ||
    scenario.slug !== "midnight-latency-incident" ||
    scenario.implementationStatus !== "ready"
  )
    notFound();
  return (
    <OperationsWorkspace sessionId={sessionId} scenarioSlug={scenario.slug} />
  );
}
