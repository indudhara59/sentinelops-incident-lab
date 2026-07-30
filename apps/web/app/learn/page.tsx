import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
export const metadata: Metadata = { title: "Learning center" };
export default function LearnPage() {
  return (
    <ContentPage
      kicker="LEARNING CENTER"
      title="Investigate with evidence, not instinct alone."
      intro="Incident response is a disciplined loop: understand impact, read signals, form a hypothesis, seek disconfirming evidence, mitigate safely, and verify recovery."
    >
      <section className="prose-section">
        <h2>A practical investigation loop</h2>
        <ol>
          <li>Establish user impact and a shared incident scope.</li>
          <li>Correlate changes with logs, metrics, traces, and topology.</li>
          <li>Record evidence separately from assumptions.</li>
          <li>Choose the lowest-risk corrective action.</li>
          <li>Verify both technical recovery and user recovery.</li>
        </ol>
      </section>
      <section className="prose-section">
        <h2>Observability, in context</h2>
        <p>
          Telemetry becomes useful when it answers a question. Metrics show the
          shape of a problem, logs add event detail, traces follow individual
          work across boundaries, and topology supplies system context.
        </p>
      </section>
    </ContentPage>
  );
}
