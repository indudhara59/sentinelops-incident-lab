/* eslint-disable react-hooks/error-boundaries -- persistence failures render an explicit availability state */
import Link from "next/link";
import { DatabaseUnavailable } from "@/components/dashboard/database-state";
import { requireOwner } from "@/lib/auth/guards";
import { listOwnedReports } from "@/lib/persistence/reports";

export default async function ReportsPage() {
  const user = await requireOwner("/dashboard/reports");
  try {
    const reports = await listOwnedReports(user.id, 50);
    return (
      <>
        <header className="dashboard-heading">
          <p className="eyebrow">Review</p>
          <h1>Incident reports</h1>
          <p>
            Completed reports generated deterministically from your recorded
            investigation.
          </p>
        </header>
        <section className="dashboard-card">
          {reports.length ? (
            <ul className="report-grid">
              {reports.map((report) => (
                <li key={report._id}>
                  <div>
                    <span className="score-badge">{report.score}/100</span>
                    <h2>{report.scenarioTitle}</h2>
                    <p>{report.summary}</p>
                    <small>
                      Completed {report.completedAt.toLocaleDateString()}
                    </small>
                  </div>
                  <Link
                    className="button button-secondary"
                    href={`/operations/${report.incidentSessionId}/report`}
                  >
                    Open report
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-dashboard">
              <h2>No completed reports</h2>
              <p>
                Complete and verify an incident to generate your first report.
              </p>
              <Link className="button" href="/scenarios">
                Start a scenario
              </Link>
            </div>
          )}
        </section>
      </>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}
