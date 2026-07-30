import { notFound } from "next/navigation";
import { ScenarioPreview } from "@/components/scenario-builder/preview";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnedCustomScenario } from "@/lib/scenario-builder/repository";

export default async function PreviewScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireOwner(`/scenario-builder/${id}/preview`);
  const scenario = await getOwnedCustomScenario(user.id, id).catch(() => null);
  if (!scenario) notFound();
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Owner preview</p>
        <h1>{scenario.title}</h1>
        <p>
          Validate topology, timeline, and deterministic sample telemetry before
          a private test run.
        </p>
      </header>
      <ScenarioPreview
        scenarioId={id}
        version={scenario.version}
        draft={scenario.draft}
        archived={scenario.archived}
      />
    </>
  );
}
