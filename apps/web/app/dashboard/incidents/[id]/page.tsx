/* eslint-disable react-hooks/error-boundaries -- persistence failures render an explicit availability state */
import Link from "next/link";
import { notFound } from "next/navigation";
import { DatabaseUnavailable } from "@/components/dashboard/database-state";
import { DeleteIncidentButton } from "@/components/dashboard/delete-incident-button";
import { ResumeIncidentLink } from "@/components/dashboard/resume-incident-link";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnedIncident } from "@/lib/persistence/incidents";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireOwner(`/dashboard/incidents/${id}`);
  try {
    const incident = await getOwnedIncident(user.id, id);
    if (!incident) notFound();
    return (
      <>
        <header className="dashboard-heading">
          <p className="eyebrow">Saved investigation</p>
          <h1>{incident.scenarioTitle}</h1>
          <p>
            Owned by your account · last updated{" "}
            {incident.updatedAt.toLocaleString()}
          </p>
        </header>
        <section className="dashboard-card detail-grid">
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{incident.status}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{incident.difficulty}</dd>
            </div>
            <div>
              <dt>Simulation time</dt>
              <dd>{Math.floor(incident.simulationTimeMs / 60_000)} minutes</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>
                {incident.score == null
                  ? "Not completed"
                  : `${incident.score}/100`}
              </dd>
            </div>
            <div>
              <dt>Scenario version</dt>
              <dd>{incident.scenarioVersion}</dd>
            </div>
            <div>
              <dt>Engine version</dt>
              <dd>{incident.engineVersion}</dd>
            </div>
          </dl>
          <div className="inline-actions">
            {incident.status === "completed" ? (
              <>
                <Link className="button" href={`/operations/${id}/report`}>
                  Open report
                </Link>
                <Link
                  className="button button-secondary"
                  href={`/operations/${id}/report#replay`}
                >
                  Replay
                </Link>
              </>
            ) : (
              <ResumeIncidentLink className="button" id={id} />
            )}
            <DeleteIncidentButton id={id} />
          </div>
        </section>
        <section className="dashboard-grid-two">
          <article className="dashboard-card">
            <h2>Important timeline</h2>
            <p>{incident.importantTimeline.length} bounded events saved.</p>
          </article>
          <article className="dashboard-card">
            <h2>Actions</h2>
            <p>{incident.actions.length} player actions saved.</p>
          </article>
        </section>
      </>
    );
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return <DatabaseUnavailable />;
  }
}
