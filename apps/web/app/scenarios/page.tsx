import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
export const metadata: Metadata = { title: "Scenarios" };
export default function ScenariosPage() {
  return (
    <ContentPage
      kicker="SCENARIO CATALOG"
      title="Incidents worth investigating."
      intro="The interactive scenario catalog is planned for Phase 2. For now, meet the first fictional incident being designed for the lab."
    >
      <div className="notice">
        <strong>The Midnight Latency Incident</strong>
        <p>
          A checkout slowdown leads from database timeouts to a connection-pool
          leak introduced after an order-service deployment. This is a simulated
          preview, not a playable scenario yet.
        </p>
      </div>
      <section className="prose-section">
        <h2>What scenarios will teach</h2>
        <p>
          Each scenario will center on evidence collection, hypothesis testing,
          mitigation, and verification—not guessing or exploitation.
        </p>
      </section>
    </ContentPage>
  );
}
