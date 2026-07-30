import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
export const metadata: Metadata = { title: "Documentation" };
export default function DocsPage() {
  return (
    <ContentPage
      kicker="PROJECT DOCUMENTATION"
      title="A safe foundation for operational learning."
      intro="SentinelOps Incident Lab is an independent educational portfolio project. Its goal is to teach incident-response reasoning using entirely fictional environments and data."
    >
      <section className="prose-section">
        <h2>Phase 1 architecture</h2>
        <p>
          A Next.js public experience and a stateless FastAPI service share a
          small contract package. The API provides health and status metadata
          only; operational simulation is deliberately out of scope.
        </p>
      </section>
      <section className="prose-section" id="security">
        <h2>Security and safety</h2>
        <p>
          The platform never connects to, scans, modifies, or interferes with
          real infrastructure. It is not a penetration-testing platform. No
          secrets or third-party credentials are required.
        </p>
      </section>
      <section className="prose-section" id="accessibility">
        <h2>Accessibility</h2>
        <p>
          The interface uses semantic landmarks, keyboard-accessible navigation,
          visible focus styles, strong contrast, responsive layouts, and
          reduced-motion preferences.
        </p>
      </section>
    </ContentPage>
  );
}
