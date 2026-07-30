/* eslint-disable react-hooks/error-boundaries -- persistence failures render an explicit availability state */
import { ArrowRight, Gauge, Trophy, Target, Activity } from "lucide-react";
import Link from "next/link";
import { DatabaseUnavailable } from "@/components/dashboard/database-state";
import { requireOwner } from "@/lib/auth/guards";
import { listOwnedIncidents } from "@/lib/persistence/incidents";
import {
  dashboardSummary,
  listOwnedReports,
  reportInvestigationAreas,
} from "@/lib/persistence/reports";

export default async function DashboardPage() {
  const user = await requireOwner("/dashboard");
  try {
    const [summary, recent, reports] = await Promise.all([
      dashboardSummary(user.id),
      listOwnedIncidents(user.id, { pageSize: 5 }),
      listOwnedReports(user.id, 4),
    ]);
    const areas = reportInvestigationAreas(reports[0]);
    return (
      <>
        <header className="dashboard-heading">
          <p className="eyebrow">Account overview</p>
          <h1>Welcome back, {user.name?.split(" ")[0] ?? "responder"}</h1>
          <p>
            Continue an investigation or review how your incident-response
            practice is developing.
          </p>
        </header>
        <section className="stat-grid" aria-label="Investigation summary">
          <article className="dashboard-card">
            <Activity aria-hidden="true" />
            <span>Investigations</span>
            <strong>{summary.total}</strong>
          </article>
          <article className="dashboard-card">
            <Gauge aria-hidden="true" />
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </article>
          <article className="dashboard-card">
            <Trophy aria-hidden="true" />
            <span>Average score</span>
            <strong>
              {summary.averageScore == null
                ? "—"
                : `${summary.averageScore}/100`}
            </strong>
          </article>
          <article className="dashboard-card">
            <Target aria-hidden="true" />
            <span>Scenarios attempted</span>
            <strong>{summary.scenariosAttempted}</strong>
          </article>
        </section>
        <section className="dashboard-grid-two">
          <div className="dashboard-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Recent activity</p>
                <h2>Investigations</h2>
              </div>
              <Link href="/dashboard/incidents">
                View all <ArrowRight size={15} />
              </Link>
            </div>
            {recent.items.length ? (
              <ul className="record-list">
                {recent.items.map((item) => (
                  <li key={item._id}>
                    <div>
                      <strong>{item.scenarioTitle}</strong>
                      <span>
                        {item.status} · {item.updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <Link href={`/dashboard/incidents/${item._id}`}>Open</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )}
          </div>
          <div className="dashboard-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Performance</p>
                <h2>Investigation strengths</h2>
              </div>
            </div>
            {reports.length ? (
              <>
                <p>
                  <strong>Strongest area:</strong> {areas.strongest}
                </p>
                <p>
                  <strong>Area for improvement:</strong> {areas.improvement}
                </p>
                <Link className="text-link" href="/dashboard/reports">
                  Review recent reports <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <p>
                Complete an incident to receive evidence-based strengths and
                improvement guidance.
              </p>
            )}
          </div>
        </section>
        <Link
          className="dashboard-card quick-start"
          href="/scenarios/midnight-latency-incident/briefing"
        >
          <div>
            <p className="eyebrow">Quick start</p>
            <h2>The Midnight Latency Incident</h2>
            <p>Practice correlation, mitigation, and recovery verification.</p>
          </div>
          <span className="button">
            Start briefing <ArrowRight size={16} />
          </span>
        </Link>
      </>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}

function EmptyState() {
  return (
    <div className="empty-dashboard">
      <p>No saved investigations yet.</p>
      <Link className="text-link" href="/scenarios">
        Browse scenarios
      </Link>
    </div>
  );
}
