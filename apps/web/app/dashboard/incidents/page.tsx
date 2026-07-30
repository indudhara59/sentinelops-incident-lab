/* eslint-disable react-hooks/error-boundaries -- persistence failures render an explicit availability state */
import Link from "next/link";
import { DatabaseUnavailable } from "@/components/dashboard/database-state";
import { requireOwner } from "@/lib/auth/guards";
import { listOwnedIncidents } from "@/lib/persistence/incidents";
import { ResumeIncidentLink } from "@/components/dashboard/resume-incident-link";

type Search = {
  search?: string;
  scenario?: string;
  status?: string;
  difficulty?: string;
  sort?: string;
  page?: string;
};

export default async function IncidentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireOwner("/dashboard/incidents");
  const params = await searchParams;
  try {
    const result = await listOwnedIncidents(user.id, {
      ...params,
      page: Number(params.page ?? 1),
    });
    const pageUrl = (page: number) => {
      const query = new URLSearchParams(
        Object.entries(params).filter((entry): entry is [string, string] =>
          Boolean(entry[1]),
        ),
      );
      query.set("page", String(page));
      return `/dashboard/incidents?${query}`;
    };
    return (
      <>
        <header className="dashboard-heading">
          <p className="eyebrow">History</p>
          <h1>Investigations</h1>
          <p>Search, resume, replay, and manage saved incident practice.</p>
        </header>
        <form
          className="history-filters dashboard-card"
          action="/dashboard/incidents"
          method="get"
        >
          <label>
            Search
            <input
              name="search"
              type="search"
              defaultValue={params.search}
              placeholder="Scenario title"
            />
          </label>
          <label>
            Scenario
            <select name="scenario" defaultValue={params.scenario ?? ""}>
              <option value="">All scenarios</option>
              <option value="scenario-midnight-latency-001">
                Midnight Latency
              </option>
            </select>
          </label>
          <label>
            Status
            <select name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>
          <label>
            Difficulty
            <select name="difficulty" defaultValue={params.difficulty ?? ""}>
              <option value="">All difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={params.sort ?? "newest"}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="score_high">Highest score</option>
              <option value="score_low">Lowest score</option>
              <option value="title">Title</option>
            </select>
          </label>
          <div className="filter-actions">
            <button className="button button-small" type="submit">
              Apply
            </button>
            <Link
              className="button button-secondary button-small"
              href="/dashboard/incidents"
            >
              Reset
            </Link>
          </div>
        </form>
        <section className="dashboard-card">
          {result.items.length ? (
            <div className="history-table-wrap">
              <table className="history-table">
                <caption className="sr-only">Saved investigations</caption>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Status</th>
                    <th>Difficulty</th>
                    <th>Started</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.scenarioTitle}</strong>
                      </td>
                      <td>
                        <span className={`status-pill status-${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.difficulty}</td>
                      <td>{item.startedAt.toLocaleDateString()}</td>
                      <td>{item.score == null ? "—" : `${item.score}/100`}</td>
                      <td>
                        <div className="table-actions">
                          <Link href={`/dashboard/incidents/${item._id}`}>
                            Details
                          </Link>
                          {item.status === "completed" ? (
                            <>
                              <Link href={`/operations/${item._id}/report`}>
                                Report
                              </Link>
                              <Link
                                href={`/operations/${item._id}/report#replay`}
                              >
                                Replay
                              </Link>
                            </>
                          ) : (
                            <ResumeIncidentLink id={item._id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-dashboard">
              <h2>No matching investigations</h2>
              <p>Adjust the filters or start a new scenario.</p>
              <Link className="button" href="/scenarios">
                Browse scenarios
              </Link>
            </div>
          )}
          <nav className="pagination" aria-label="History pages">
            <Link
              aria-disabled={result.page <= 1}
              tabIndex={result.page <= 1 ? -1 : undefined}
              href={result.page <= 1 ? pageUrl(1) : pageUrl(result.page - 1)}
            >
              Previous
            </Link>
            <span>
              Page {result.page} of {result.totalPages}
            </span>
            <Link
              aria-disabled={result.page >= result.totalPages}
              tabIndex={result.page >= result.totalPages ? -1 : undefined}
              href={
                result.page >= result.totalPages
                  ? pageUrl(result.totalPages)
                  : pageUrl(result.page + 1)
              }
            >
              Next
            </Link>
          </nav>
        </section>
      </>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}
