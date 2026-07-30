import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScenarioBriefing } from "@/components/scenario-briefing";
import { getScenarioBySlug, scenarios } from "@/data/scenarios";

export function generateStaticParams() {
  return scenarios.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const scenario = getScenarioBySlug((await params).slug);
  return scenario
    ? { title: scenario.title, description: scenario.description }
    : { title: "Scenario not found" };
}
export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const scenario = getScenarioBySlug((await params).slug);
  if (!scenario) notFound();
  return <ScenarioBriefing scenario={scenario} />;
}
