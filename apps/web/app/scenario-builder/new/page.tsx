import { ScenarioEditor } from "@/components/scenario-builder/editor";
import { requireOwner } from "@/lib/auth/guards";

export default async function NewScenarioPage() {
  await requireOwner("/scenario-builder/new");
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Private draft</p>
        <h1>Create custom scenario</h1>
        <p>
          Author data only. The validator rejects code, commands, external
          destinations, unsafe templates, impossible recovery, and invalid
          topology.
        </p>
      </header>
      <ScenarioEditor />
    </>
  );
}
