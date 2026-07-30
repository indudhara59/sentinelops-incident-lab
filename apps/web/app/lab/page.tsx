import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
export const metadata: Metadata = { title: "Incident Lab" };
export default function LabPage() {
  return (
    <ContentPage
      kicker="LIVE WORKSPACE · PHASE 3"
      title="The incident room is being prepared."
      intro="The live incident workspace arrives in Phase 3. Phase 2 lets you browse fictional scenarios, review briefings, and prepare an investigation safely."
    >
      <div className="notice">
        <strong>Phase 2 status</strong>
        <p>
          No live workspace, telemetry stream, commands, WebSockets,
          authentication, or scoring are active. Nothing on this page connects
          to real infrastructure.
        </p>
      </div>
      <section className="prose-section">
        <h2>Planned workspace</h2>
        <ul>
          <li>Fictional service topology and deployment history</li>
          <li>Simulated logs, metrics, traces, and alerts</li>
          <li>Evidence collection and corrective actions</li>
          <li>A learning-focused post-incident report</li>
        </ul>
      </section>
    </ContentPage>
  );
}
