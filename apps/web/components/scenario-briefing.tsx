import type { PublicScenarioDefinition } from "@sentinelops/shared";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Radio,
  ShieldCheck,
  Siren,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { StartInvestigation } from "@/components/start-investigation";

const checklist = [
  "Confirm impact",
  "Check recent changes",
  "Review telemetry",
  "Build hypotheses",
  "Collect evidence",
  "Mitigate",
  "Verify recovery",
  "Document findings",
];

export function ScenarioBriefing({
  scenario,
}: {
  scenario: PublicScenarioDefinition;
}) {
  const start = new Date(scenario.timeline.startTime);
  return (
    <main id="main-content" className="briefing-page">
      <div className="briefing-alert">
        <div className="container">
          <AlertTriangle size={17} />
          <strong>Simulated environment:</strong> Every organization, service,
          signal, and action in this briefing is fictional. Nothing connects to
          real infrastructure.
        </div>
      </div>
      <header className="briefing-header grid-bg">
        <div className="container">
          <nav aria-label="Breadcrumb">
            <Link href="/scenarios">Scenarios</Link>
            <span>/</span>
            <span aria-current="page">Briefing</span>
          </nav>
          <div className="briefing-title-row">
            <div>
              <div className="eyebrow">
                <Radio size={14} /> INCIDENT BRIEFING ·{" "}
                {scenario.implementationStatus.toUpperCase()}
              </div>
              <h1>{scenario.title}</h1>
              <p>
                {scenario.organization} · {scenario.environmentType}
              </p>
            </div>
            <div
              className={`severity-badge ${scenario.severity.toLowerCase()}`}
            >
              <span>{scenario.severity}</span>
              <small>INCIDENT SEVERITY</small>
            </div>
          </div>
        </div>
      </header>
      <div className="container briefing-layout">
        <div className="briefing-main">
          <BriefingSection
            icon={Siren}
            eyebrow="INITIAL NOTIFICATION"
            title="Incident notification"
          >
            <p className="briefing-callout">{scenario.initialNotification}</p>
          </BriefingSection>
          <BriefingSection
            icon={AlertTriangle}
            eyebrow="CURRENT SITUATION"
            title="Known impact"
          >
            <ul className="check-list">
              {scenario.knownImpact.map((impact) => (
                <li key={impact}>
                  <CheckCircle2 size={15} />
                  {impact}
                </li>
              ))}
            </ul>
          </BriefingSection>
          <BriefingSection
            icon={Radio}
            eyebrow="TRIGGERED SIGNALS"
            title="Initial alerts"
          >
            <div className="alert-list">
              {scenario.initialAlerts.map((alert) => (
                <article key={alert.title}>
                  <span className={alert.severity}>{alert.severity}</span>
                  <div>
                    <h3>{alert.title}</h3>
                    <small>{alert.source}</small>
                    <p>{alert.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </BriefingSection>
          <BriefingSection
            icon={Wrench}
            eyebrow="ENVIRONMENT"
            title="Affected services"
          >
            <div
              className="service-table"
              role="table"
              aria-label="Affected services"
            >
              <div className="service-row table-head" role="row">
                <span role="columnheader">Service</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Responsibility</span>
              </div>
              {scenario.services.map((service) => (
                <div className="service-row" role="row" key={service.id}>
                  <strong role="cell">{service.name}</strong>
                  <span role="cell">{service.type}</span>
                  <span role="cell">{service.responsibility}</span>
                </div>
              ))}
            </div>
          </BriefingSection>
          <BriefingSection
            icon={ShieldCheck}
            eyebrow="RULES OF ENGAGEMENT"
            title="Investigate safely"
          >
            <ul>
              <li>
                Use only the simulated tools and evidence provided by the lab.
              </li>
              <li>
                Do not attempt to connect to or reproduce activity against real
                systems.
              </li>
              <li>
                Treat observations as evidence and keep hypotheses explicitly
                provisional.
              </li>
              <li>
                Prefer the lowest-risk simulated mitigation and verify recovery.
              </li>
            </ul>
          </BriefingSection>
        </div>
        <aside
          className="briefing-sidebar"
          aria-label="Investigation preparation"
        >
          <section className="briefing-summary">
            <span className="kicker">MISSION DETAILS</span>
            <dl>
              <div>
                <dt>Estimated time</dt>
                <dd>
                  <Clock3 size={14} /> {scenario.estimatedDurationMinutes}{" "}
                  minutes
                </dd>
              </div>
              <div>
                <dt>Timeline start</dt>
                <dd>
                  {start.toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{scenario.difficulty}</dd>
              </div>
              <div>
                <dt>Environment</dt>
                <dd>{scenario.environmentType}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>Learning objectives</h2>
            <ul className="sidebar-list">
              {scenario.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Available tools</h2>
            <div className="tool-list">
              {scenario.availableTools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
          </section>
          <section className="commander-checklist">
            <h2>Incident commander checklist</h2>
            <ol>
              {checklist.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
          </section>
          <section className="start-panel">
            <StartInvestigation
              scenarioSlug={scenario.slug}
              ready={scenario.implementationStatus === "ready"}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}

function BriefingSection({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof Siren;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="briefing-section">
      <div className="briefing-section-heading">
        <Icon size={18} />
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
