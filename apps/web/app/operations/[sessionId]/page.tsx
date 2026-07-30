import { isValidLocalSessionId } from "@/lib/local-session";
import { getScenarioBySlug } from "@/data/scenarios";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function OperationsPlaceholder({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ scenario?: string }>;
}) {
  const [{ sessionId }, { scenario: slug }] = await Promise.all([
    params,
    searchParams,
  ]);
  const scenario = slug ? getScenarioBySlug(slug) : undefined;
  if (
    !isValidLocalSessionId(sessionId) ||
    !scenario ||
    scenario.implementationStatus !== "ready"
  )
    notFound();
  return (
    <main id="main-content" className="content-page grid-bg">
      <div className="container page-inner">
        <span className="kicker">PHASE 3 PLACEHOLDER · LOCAL SESSION</span>
        <h1>Your incident room is queued.</h1>
        <p className="intro">
          A temporary local session was created for{" "}
          <strong>{scenario.title}</strong>. The live operations workspace is
          intentionally not implemented in Phase 2.
        </p>
        <div className="notice safe-notice">
          <ShieldCheck size={18} />
          <div>
            <strong>Nothing is running.</strong>
            <p>
              No telemetry engine, WebSocket, backend session, scoring, or
              persistent storage was started. Closing the tab ends the local
              session context.
            </p>
          </div>
        </div>
        <section className="prose-section">
          <h2>Session reference</h2>
          <p className="mono">{sessionId}</p>
        </section>
        <div className="page-actions">
          <Link className="button" href={`/scenarios/${scenario.slug}`}>
            Return to briefing
          </Link>
          <Link className="button secondary" href="/scenarios">
            Browse scenarios
          </Link>
        </div>
      </div>
    </main>
  );
}
