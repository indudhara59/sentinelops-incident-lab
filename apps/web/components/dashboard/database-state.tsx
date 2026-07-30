import Link from "next/link";

export function DatabaseUnavailable({
  message = "Saved data is temporarily unavailable.",
}: {
  message?: string;
}) {
  return (
    <section className="dashboard-card status-banner" role="status">
      <h2>Atlas connection unavailable</h2>
      <p>{message} Your active simulation is not changed.</p>
      <Link className="button button-secondary" href="/scenarios">
        Browse scenarios
      </Link>
    </section>
  );
}
