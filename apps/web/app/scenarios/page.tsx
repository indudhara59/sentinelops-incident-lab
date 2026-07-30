import type { Metadata } from "next";
import { ScenarioCatalog } from "@/components/scenario-catalog";
import { scenarios, serviceTypes } from "@/data/scenarios";

export const metadata: Metadata = {
  title: "Scenario catalog",
  description: "Browse safe, fictional incident-response learning scenarios.",
};

export default function ScenariosPage() {
  return (
    <main id="main-content" className="catalog-page">
      <section className="catalog-hero grid-bg">
        <div className="container">
          <span className="kicker">SCENARIO CATALOG · PHASE 2</span>
          <h1>Choose your next incident.</h1>
          <p>
            Practice disciplined response inside fictional environments. Browse
            the briefings now; the operational simulations arrive in Phase 3.
          </p>
        </div>
      </section>
      <ScenarioCatalog scenarios={scenarios} serviceTypes={serviceTypes} />
    </main>
  );
}
