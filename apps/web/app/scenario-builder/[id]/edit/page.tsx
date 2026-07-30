import { notFound } from "next/navigation";
import { ScenarioEditor } from "@/components/scenario-builder/editor";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnedCustomScenario } from "@/lib/scenario-builder/repository";

export default async function EditScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireOwner(`/scenario-builder/${id}/edit`);
  const scenario = await getOwnedCustomScenario(user.id, id).catch(() => null);
  if (!scenario) notFound();
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Private draft · version {scenario.version}</p>
        <h1>Edit {scenario.title}</h1>
        <p>
          Completed-session versions remain immutable; meaningful changes create
          a new exact version.
        </p>
      </header>
      <ScenarioEditor scenarioId={id} initial={scenario.draft} />
    </>
  );
}
