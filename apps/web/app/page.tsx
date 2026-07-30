import {
  Activity,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  Box,
  Check,
  ChevronRight,
  CircleDot,
  FileCheck2,
  GitBranch,
  Radar,
  Search,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import Link from "next/link";
import { TopologyPreview } from "@/components/topology-preview";

const capabilities = [
  {
    icon: GitBranch,
    title: "Interactive service maps",
    text: "Trace dependencies and understand blast radius across a fictional cloud system.",
  },
  {
    icon: TerminalSquare,
    title: "Live simulated logs",
    text: "Filter structured event streams and find signals hidden inside operational noise.",
  },
  {
    icon: Activity,
    title: "Metrics and alerts",
    text: "Correlate latency, traffic, errors, and saturation with meaningful alert context.",
  },
  {
    icon: CircleDot,
    title: "Distributed traces",
    text: "Follow requests across service boundaries to isolate slow and failing spans.",
  },
  {
    icon: Search,
    title: "Root-cause analysis",
    text: "Build hypotheses, collect evidence, and distinguish symptoms from causes.",
  },
  {
    icon: FileCheck2,
    title: "Incident reports",
    text: "Review decisions and turn the investigation into durable operational learning.",
  },
];

const workflow = [
  [
    "01",
    "Receive the incident briefing",
    "Understand impact, severity, and the first known signals.",
  ],
  [
    "02",
    "Inspect telemetry",
    "Move through topology, logs, metrics, alerts, and traces.",
  ],
  [
    "03",
    "Collect evidence",
    "Save observations that support or challenge your hypothesis.",
  ],
  [
    "04",
    "Identify the root cause",
    "Connect the evidence into a defensible causal explanation.",
  ],
  [
    "05",
    "Apply corrective action",
    "Choose a safe simulated mitigation and verify recovery.",
  ],
  [
    "06",
    "Review the report",
    "Compare your approach and capture lessons for the next incident.",
  ],
];

const outcomes = [
  "Observability fundamentals",
  "Incident triage",
  "Hypothesis-based investigation",
  "Root-cause analysis",
  "Mitigation and verification",
  "Post-incident review",
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero grid-bg">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Radar size={14} /> SAFE · SIMULATED · EDUCATIONAL
            </div>
            <h1>
              Learn incident response by <em>running the investigation.</em>
            </h1>
            <p>
              Build real observability instincts inside realistic, fictional
              cloud incidents. Read the signals, test your hypotheses, find the
              root cause, and restore service—without touching real
              infrastructure.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/lab">
                Start Investigation <ArrowRight size={17} />
              </Link>
              <Link className="button secondary" href="/scenarios">
                Explore Scenarios
              </Link>
            </div>
            <div className="hero-notes">
              <span>
                <Check /> No account required
              </span>
              <span>
                <ShieldCheck /> 100% simulated environment
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <TopologyPreview />
          </div>
        </div>
      </section>

      <section
        className="section capability-section"
        id="platform"
        aria-labelledby="capabilities-title"
      >
        <div className="container">
          <div className="section-heading centered">
            <span className="kicker">THE INCIDENT WORKBENCH</span>
            <h2 id="capabilities-title">
              Every signal tells part of the story.
            </h2>
            <p>
              Investigate the way experienced responders do: follow evidence
              across the full observability stack.
            </p>
          </div>
          <div className="capability-grid">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article className="capability-card" key={title}>
                <div className="card-icon">
                  <Icon size={21} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span>
                  Explore capability <ChevronRight size={14} />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section workflow-section"
        id="workflow"
        aria-labelledby="workflow-title"
      >
        <div className="container workflow-layout">
          <div className="section-heading sticky-heading">
            <span className="kicker">A DISCIPLINED RESPONSE</span>
            <h2 id="workflow-title">From alert to understanding.</h2>
            <p>
              Each scenario guides you through a structured response without
              giving away the answer.
            </p>
            <Link className="text-link" href="/learn">
              Learn the methodology <ArrowRight size={15} />
            </Link>
          </div>
          <ol className="workflow-list">
            {workflow.map(([number, title, text]) => (
              <li key={number}>
                <span className="step-number">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="section incident-section"
        aria-labelledby="incident-title"
      >
        <div className="container incident-card">
          <div className="incident-copy">
            <span className="simulated-badge">
              <span /> SIMULATED INCIDENT PREVIEW
            </span>
            <p className="overline">SCENARIO 01 · INTERMEDIATE</p>
            <h2 id="incident-title">The Midnight Latency Incident</h2>
            <p className="lead">
              Checkout latency is climbing across a fictional e-commerce
              platform. Revenue is at risk, but no service has failed outright.
            </p>
            <div className="incident-facts">
              <div>
                <span>IMPACT</span>
                <strong>Checkout slowdown</strong>
              </div>
              <div>
                <span>INITIAL SIGNAL</span>
                <strong>Order-service DB timeout</strong>
              </div>
              <div>
                <span>ROOT CAUSE</span>
                <strong>Connection-pool leak after deployment</strong>
              </div>
            </div>
            <Link className="button secondary" href="/scenarios">
              View scenario preview <ArrowRight size={16} />
            </Link>
          </div>
          <div
            className="incident-console"
            aria-label="Simulated incident evidence summary"
          >
            <div className="console-bar">
              <span>
                <i />
                <i />
                <i />
              </span>
              <b>investigation.timeline</b>
              <span>SIMULATION</span>
            </div>
            <div className="console-body mono">
              <p>
                <time>00:00</time>
                <span className="event-alert">ALERT</span> checkout_latency_p95
                &gt; 2s
              </p>
              <p>
                <time>00:04</time>
                <span className="event-info">DEPLOY</span> order-service v2.14.7
                detected
              </p>
              <p>
                <time>00:11</time>
                <span className="event-warn">EVIDENCE</span> active_connections
                = pool_limit
              </p>
              <p>
                <time>00:18</time>
                <span className="event-root">HYPOTHESIS</span> connection leak
                after deploy
              </p>
              <div className="trace-bars">
                <span style={{ width: "92%" }} />
                <span style={{ width: "61%" }} />
                <span className="slow" style={{ width: "100%" }} />
                <span style={{ width: "44%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section outcomes-section"
        aria-labelledby="outcomes-title"
      >
        <div className="container outcomes-grid">
          <div className="section-heading">
            <span className="kicker">BUILT FOR PRACTICE</span>
            <h2 id="outcomes-title">Skills that transfer to the real world.</h2>
            <p>The systems are fictional. The investigation habits are not.</p>
          </div>
          <div className="outcome-list">
            {outcomes.map((outcome) => (
              <div key={outcome}>
                <BookOpenCheck size={18} />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section safety-section"
        aria-labelledby="safety-title"
      >
        <div className="container safety-panel">
          <div className="safety-icon">
            <ShieldCheck size={30} />
          </div>
          <div>
            <span className="kicker">SAFE BY DESIGN</span>
            <h2 id="safety-title">Real learning. Zero real-world risk.</h2>
            <p>
              All services, telemetry, commands, and outcomes exist only inside
              a controlled simulation.
            </p>
          </div>
          <ul>
            <li>
              <Box size={17} /> No connection to real infrastructure
            </li>
            <li>
              <BellRing size={17} /> No live systems are scanned or modified
            </li>
            <li>
              <ShieldCheck size={17} /> Not a penetration-testing platform
            </li>
          </ul>
        </div>
      </section>

      <section className="final-cta grid-bg">
        <div className="container">
          <span className="kicker">YOUR NEXT INCIDENT IS FICTIONAL</span>
          <h2>Build calm before the alert fires.</h2>
          <p>
            Explore the scenario briefings and see what is coming to the live
            incident lab.
          </p>
          <Link className="button" href="/lab">
            Enter Incident Lab <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
