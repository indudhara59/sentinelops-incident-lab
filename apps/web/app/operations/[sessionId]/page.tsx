import { OperationsWorkspace } from "@/components/operations/workspace";
import { getScenarioBySlug } from "@/data/scenarios";
import { isValidLocalSessionId } from "@/lib/local-session";
import type { ToolId } from "@/lib/simulation/types";
import { notFound } from "next/navigation";

export default async function OperationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{
    scenario?: string;
    tool?: string;
    service?: string;
    trace?: string;
    deployment?: string;
    range?: string;
  }>;
}) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const scenario = query.scenario
    ? getScenarioBySlug(query.scenario)
    : undefined;
  if (
    !isValidLocalSessionId(sessionId) ||
    !scenario ||
    scenario.slug !== "midnight-latency-incident" ||
    scenario.implementationStatus !== "ready"
  )
    notFound();
  const validTools = new Set<ToolId>([
    "overview",
    "alerts",
    "logs",
    "metrics",
    "traces",
    "deployments",
    "evidence",
    "actions",
    "notes",
  ]);
  const tool = validTools.has(query.tool as ToolId)
    ? (query.tool as ToolId)
    : "overview";
  const timeRange = ["5m", "15m", "30m", "all"].includes(query.range ?? "")
    ? (query.range as "5m" | "15m" | "30m" | "all")
    : "15m";
  return (
    <OperationsWorkspace
      sessionId={sessionId}
      scenarioSlug={scenario.slug}
      initialCorrelation={{
        tool,
        service: query.service ?? null,
        traceId: query.trace ?? null,
        deploymentId: query.deployment ?? null,
        timeRange,
      }}
    />
  );
}
