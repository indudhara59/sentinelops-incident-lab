import Link from "next/link";
import { DatabaseUnavailable } from "@/components/dashboard/database-state";
import { requireOwner } from "@/lib/auth/guards";
import { listOwnedCustomScenarios } from "@/lib/scenario-builder/repository";

export default async function ScenarioBuilderPage() {
  const user = await requireOwner("/scenario-builder");
  const scenarios = await listOwnedCustomScenarios(user.id).catch(() => null);
  if (!scenarios) return <DatabaseUnavailable />;
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Authorized private authoring</p>
        <h1>Scenario builder</h1>
        <p>
          Create bounded declarative simulations. Custom scenarios stay private
          and cannot contain executable code, commands, credentials, network
          destinations, or real infrastructure connections.
        </p>
        <Link className="button" href="/scenario-builder/new">
          Create scenario
        </Link>
      </header>
      <section className="dashboard-card">
        {scenarios.length ? (
          <ul className="builder-list">
            {scenarios.map((scenario) => (
              <li key={scenario.scenarioId}>
                <div>
                  <span className="score-badge">
                    Private · v{scenario.version}
                  </span>
                  <h2>{scenario.title || "Untitled scenario"}</h2>
                  <p>
                    {scenario.difficulty} · {scenario.validationStatus} ·{" "}
                    {scenario.archived ? "archived" : "draft"}
                  </p>
                </div>
                <div className="inline-actions">
                  <Link href={`/scenario-builder/${scenario.scenarioId}/edit`}>
                    Edit
                  </Link>
                  <Link
                    href={`/scenario-builder/${scenario.scenarioId}/preview`}
                  >
                    Preview
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-dashboard">
            <h2>No custom scenarios</h2>
            <p>
              Start with a private draft. Nothing is published publicly in Phase
              8.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
