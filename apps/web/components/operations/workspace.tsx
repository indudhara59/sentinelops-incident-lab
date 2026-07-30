"use client";

import { actionDefinitions } from "@/lib/simulation/scenario";
import {
  availableEvidence,
  canRevealConclusion,
  playerVisibleStage,
} from "@/lib/simulation/engine";
import type {
  ActionId,
  EvidenceDefinition,
  SimulationEvent,
  SimulationState,
  ToolId,
} from "@/lib/simulation/types";
import { useSimulation } from "@/lib/simulation/use-simulation";
import { useAuthoritativeSimulation } from "@/lib/simulation/use-authoritative-simulation";
import { loadLocalSession } from "@/lib/local-session";
import {
  AlertCenter,
  DeploymentExplorer,
  LogExplorer,
  MetricsExplorer,
  TraceExplorer,
} from "./telemetry-explorers";
import {
  Activity,
  AlertTriangle,
  BellRing,
  BookMarked,
  Boxes,
  ChevronRight,
  FileClock,
  FileText,
  Gauge,
  GitCommitHorizontal,
  ListTree,
  Maximize2,
  Network,
  NotebookPen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  StepForward,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const tools: { id: ToolId; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Boxes },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "metrics", label: "Metrics", icon: Activity },
  { id: "traces", label: "Traces", icon: GitCommitHorizontal },
  { id: "deployments", label: "Deployments", icon: FileClock },
  { id: "evidence", label: "Evidence", icon: BookMarked },
  { id: "actions", label: "Actions", icon: ShieldCheck },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

export function OperationsWorkspace({
  sessionId,
  scenarioSlug,
  initialCorrelation,
}: {
  sessionId: string;
  scenarioSlug: string;
  initialCorrelation?: Parameters<typeof useSimulation>[2];
}) {
  const recordRaw = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem(`sentinelops:${sessionId}`),
    () => null,
  );
  const record = useMemo(
    () => (recordRaw ? loadLocalSession(sessionId) : null),
    [recordRaw, sessionId],
  );
  const { state, dispatch, connection, lastSynchronized, actionError } =
    useAuthoritativeSimulation(
      "scenario-midnight-latency-001",
      sessionId,
      record,
      initialCorrelation,
    );
  if (!record || record.scenarioSlug !== scenarioSlug)
    return <InvalidLocalSession />;
  return (
    <Workspace
      state={state}
      dispatch={dispatch}
      connection={connection}
      lastSynchronized={lastSynchronized}
      actionError={actionError}
    />
  );
}

function Workspace({
  state,
  dispatch,
  connection,
  lastSynchronized,
  actionError,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
  connection: string;
  lastSynchronized: string | null;
  actionError: string;
}) {
  const [exitOpen, setExitOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [textMap, setTextMap] = useState(false);
  const selected = state.services.find(
    ({ id }) => id === state.selectedServiceId,
  );
  const elapsed = `${String(Math.floor(state.elapsedSeconds / 60)).padStart(2, "0")}:${String(state.elapsedSeconds % 60).padStart(2, "0")}`;
  const impact =
    state.stage === "Completed"
      ? "Checkout recovered"
      : ["Checkout errors", "Incident mitigation"].includes(state.stage)
        ? "Checkout failures active"
        : [
              "Order-service latency increase",
              "Database pool saturation",
            ].includes(state.stage)
          ? "Checkout latency elevated"
          : "No confirmed customer impact";
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tool", state.activeTool);
    if (state.correlation.service)
      params.set("service", state.correlation.service);
    else params.delete("service");
    if (state.correlation.traceId)
      params.set("trace", state.correlation.traceId);
    else params.delete("trace");
    if (state.correlation.deploymentId)
      params.set("deployment", state.correlation.deploymentId);
    else params.delete("deployment");
    params.set("range", state.correlation.timeRange);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [state.activeTool, state.correlation]);
  return (
    <main id="main-content" className="operations-workspace">
      <div className="sr-only" role="status" aria-live="assertive">
        {state.announcement}
      </div>
      <section className={`connection-banner ${connection}`} aria-live="polite">
        <strong>
          {connection === "local-fallback"
            ? "Local educational fallback"
            : `API ${connection}`}
        </strong>
        <span>
          {connection === "unavailable"
            ? "The API is unavailable. Your current snapshot remains visible; retry after the service recovers."
            : connection === "local-fallback"
              ? "This temporary simulation runs only in this tab and is not synchronized or persisted."
              : lastSynchronized
                ? `Last synchronized ${new Date(lastSynchronized).toLocaleTimeString()}`
                : "Establishing an authoritative simulation session…"}
        </span>
      </section>
      {actionError && (
        <p className="action-sync-error" role="alert">
          Action not applied: {actionError}
        </p>
      )}
      <header className="incident-bar">
        <div>
          <span className="severity-pill">SEV-2</span>
          <div>
            <span>INC-0042 · SIMULATED</span>
            <h1>The Midnight Latency Incident</h1>
          </div>
        </div>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>
              <i className={`status-dot ${state.status}`} />
              {state.status}
            </dd>
          </div>
          <div>
            <dt>Elapsed</dt>
            <dd className="mono">{elapsed}</dd>
          </div>
          <div>
            <dt>Current impact</dt>
            <dd>{impact}</dd>
          </div>
        </dl>
        <div className="incident-controls">
          {state.status === "ready" ? (
            <button type="button" onClick={() => dispatch({ type: "START" })}>
              <Play size={15} /> Start simulation
            </button>
          ) : state.status === "running" ? (
            <button type="button" onClick={() => dispatch({ type: "PAUSE" })}>
              <Pause size={15} /> Pause
            </button>
          ) : state.status === "paused" ? (
            <button type="button" onClick={() => dispatch({ type: "RESUME" })}>
              <Play size={15} /> Resume
            </button>
          ) : null}
          <button
            className="exit-button"
            type="button"
            onClick={() => setExitOpen(true)}
          >
            Exit
          </button>
        </div>
      </header>
      <div className="workspace-controls" aria-label="Simulation controls">
        <span>
          Stage: <strong>{playerVisibleStage(state)}</strong>
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: "ADVANCE" })}
          disabled={state.status === "running" || state.status === "completed"}
        >
          <StepForward size={14} /> Advance interval
        </button>
        <label>
          Speed
          <select
            aria-label="Simulation speed"
            value={state.speed}
            disabled={connection !== "local-fallback"}
            title={
              connection !== "local-fallback"
                ? "Server simulation speed is fixed in Phase 5."
                : undefined
            }
            onChange={(event) =>
              dispatch({
                type: "SET_SPEED",
                speed: Number(event.target.value) as 1 | 2 | 4,
              })
            }
          >
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          disabled={connection !== "local-fallback"}
          title={
            connection !== "local-fallback"
              ? "Authoritative sessions cannot be reset in Phase 5."
              : undefined
          }
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
      <div className="workspace-shell">
        <ToolNavigation state={state} dispatch={dispatch} />
        <section className="workspace-center">
          <div className="topology-toolbar">
            <div>
              <Network size={16} />
              <strong>Service topology</strong>
              <span>10 fictional services</span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setTextMap((value) => !value)}
              >
                <ListTree size={14} />
                {textMap ? "Visual map" : "Text alternative"}
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "SELECT_SERVICE", serviceId: null })
                }
              >
                <Maximize2 size={14} /> Fit view
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "SELECT_SERVICE", serviceId: null })
                }
              >
                <RotateCcw size={14} /> Reset view
              </button>
            </div>
          </div>
          {textMap ? (
            <TextTopology state={state} dispatch={dispatch} />
          ) : (
            <ServiceMap state={state} dispatch={dispatch} />
          )}
          <div
            id="tool-panel"
            role="tabpanel"
            aria-labelledby={`tab-${state.activeTool}`}
            tabIndex={0}
            className="tool-panel"
          >
            <ToolPanel state={state} dispatch={dispatch} />
          </div>
        </section>
        <ServiceDrawer service={selected} state={state} dispatch={dispatch} />
      </div>
      <ConfirmDialog
        open={exitOpen}
        title="Abandon this local investigation?"
        description="Progress in this tab will be abandoned. No server history exists."
        confirmLabel="Exit investigation"
        onCancel={() => setExitOpen(false)}
        href="/scenarios/midnight-latency-incident"
      />
      <ConfirmDialog
        open={resetOpen}
        title="Reset deterministic simulation?"
        description="Telemetry, evidence, hypotheses, actions, and notes will return to the original seeded state."
        confirmLabel="Reset simulation"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          dispatch({ type: "RESET" });
          setResetOpen(false);
        }}
      />
    </main>
  );
}

function ToolNavigation({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <nav
      className="tool-nav"
      aria-label="Investigation tools"
      role="tablist"
      aria-orientation="vertical"
    >
      {tools.map(({ id, label, icon: Icon }, index) => (
        <button
          key={id}
          id={`tab-${id}`}
          role="tab"
          aria-selected={state.activeTool === id}
          aria-controls="tool-panel"
          tabIndex={state.activeTool === id ? 0 : -1}
          onKeyDown={(event) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tools.length - 1
                  : event.key === "ArrowDown"
                    ? (index + 1) % tools.length
                    : (index - 1 + tools.length) % tools.length;
            const tool = tools[next]!;
            dispatch({ type: "SET_TOOL", tool: tool.id });
            document.getElementById(`tab-${tool.id}`)?.focus();
          }}
          onClick={() => dispatch({ type: "SET_TOOL", tool: id })}
        >
          <Icon size={16} />
          <span>{label}</span>
          {id === "evidence" && state.collectedEvidence.length > 0 && (
            <b>{state.collectedEvidence.length}</b>
          )}
        </button>
      ))}
    </nav>
  );
}

function ServiceMap({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <div
      className="service-map"
      aria-label="Interactive simulated service topology"
    >
      <svg viewBox="0 0 1000 310" aria-hidden="true">
        <path d="M90 155H180M285 155L360 65M285 155L360 130M285 155L360 200M285 155L520 135M470 200L520 135M640 135L720 65M640 135L720 135M640 135L720 220M835 220L890 220M640 135L720 270" />
      </svg>
      {state.services.map((service, index) => (
        <button
          type="button"
          key={service.id}
          className={`map-node node-${index} ${service.health} ${state.selectedServiceId === service.id ? "selected" : ""}`}
          onClick={() =>
            dispatch({ type: "SELECT_SERVICE", serviceId: service.id })
          }
          aria-label={`${service.name}, ${service.health}, ${service.requestsPerMinute} requests per minute, ${service.errorRate}% errors, ${service.latencyMs} milliseconds latency`}
        >
          <span className="node-health">{service.health}</span>
          <strong>{service.name}</strong>
          <small>
            {service.requestsPerMinute}/m · {service.errorRate}% err ·{" "}
            {service.latencyMs}ms
          </small>
        </button>
      ))}
    </div>
  );
}
function TextTopology({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <div className="text-topology">
      <p>
        This textual alternative lists every service, health state, and
        dependency.
      </p>
      <ul>
        {state.services.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "SELECT_SERVICE", serviceId: service.id })
              }
            >
              <strong>{service.name}</strong> — {service.health}. Depends on{" "}
              {service.dependencies.length
                ? service.dependencies
                    .map(
                      (id) =>
                        state.services.find((item) => item.id === id)?.name,
                    )
                    .join(", ")
                : "no simulated downstream services"}
              .
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceDrawer({
  service,
  state,
  dispatch,
}: {
  service: SimulationState["services"][number] | undefined;
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <aside
      className={`investigation-drawer ${service ? "open" : ""}`}
      aria-label="Selected service details"
    >
      {service ? (
        <>
          <button
            className="drawer-close"
            aria-label="Close service details"
            type="button"
            onClick={() =>
              dispatch({ type: "SELECT_SERVICE", serviceId: null })
            }
          >
            <X size={16} />
          </button>
          <span className={`health-badge ${service.health}`}>
            {service.health}
          </span>
          <h2>{service.name}</h2>
          <p>{service.type} · simulated service</p>
          <dl>
            <div>
              <dt>Request rate</dt>
              <dd>{service.requestsPerMinute}/min</dd>
            </div>
            <div>
              <dt>Error rate</dt>
              <dd>{service.errorRate}%</dd>
            </div>
            <div>
              <dt>p95 latency</dt>
              <dd>{service.latencyMs} ms</dd>
            </div>
          </dl>
          <h3>Current signals</h3>
          <p>
            {service.health === "healthy"
              ? "Signals are within expected bounds."
              : "Latency and error indicators require investigation."}
          </p>
          <h3>Related alerts</h3>
          <p>
            {service.id === "order" && state.elapsedSeconds >= 120
              ? "Order-service latency SLO burn"
              : "No active service-specific alert."}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_TOOL", tool: "metrics" })}
          >
            Open filtered metrics <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_TOOL", tool: "logs" })}
          >
            Open filtered logs <ChevronRight size={14} />
          </button>
        </>
      ) : (
        <div className="drawer-empty">
          <Search size={22} />
          <h2>Select a service</h2>
          <p>
            Choose a topology node to inspect health, signals, and telemetry.
          </p>
        </div>
      )}
    </aside>
  );
}

function ToolPanel({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  if (state.activeTool === "overview")
    return <Overview state={state} dispatch={dispatch} />;
  if (state.activeTool === "evidence")
    return <EvidenceWorkspace state={state} dispatch={dispatch} />;
  if (state.activeTool === "actions")
    return <ActionPanel state={state} dispatch={dispatch} />;
  if (state.activeTool === "notes")
    return (
      <div>
        <PanelTitle icon={NotebookPen} title="Investigation notes" />
        <label className="notes-field">
          Private local notes
          <textarea
            value={state.notes}
            onChange={(event) =>
              dispatch({ type: "SET_NOTES", notes: event.target.value })
            }
            placeholder="Record observations, questions, and next steps…"
          />
        </label>
      </div>
    );
  if (state.activeTool === "logs")
    return <LogExplorer state={state} dispatch={dispatch} />;
  if (state.activeTool === "metrics")
    return <MetricsExplorer state={state} dispatch={dispatch} />;
  if (state.activeTool === "traces")
    return <TraceExplorer state={state} dispatch={dispatch} />;
  if (state.activeTool === "alerts")
    return <AlertCenter state={state} dispatch={dispatch} />;
  if (state.activeTool === "deployments")
    return <DeploymentExplorer state={state} dispatch={dispatch} />;
  const source = (
    {
      alerts: "Alerts",
      logs: "Logs",
      metrics: "Metrics",
      traces: "Traces",
      deployments: "Deployments",
    } as const
  )[
    state.activeTool as "alerts" | "logs" | "metrics" | "traces" | "deployments"
  ];
  const items = availableEvidence(state).filter(
    (item) => item.source === source,
  );
  return (
    <div>
      <PanelTitle
        icon={
          source === "Metrics"
            ? Gauge
            : source === "Logs"
              ? FileText
              : source === "Traces"
                ? GitCommitHorizontal
                : source === "Deployments"
                  ? FileClock
                  : BellRing
        }
        title={source}
      />
      {source === "Metrics" && <MetricView state={state} />}
      {source === "Logs" && <LogView state={state} />}
      {source === "Traces" && <TraceView state={state} />}
      {source === "Deployments" && <DeploymentView />}
      {source === "Alerts" && <AlertView state={state} />}
      <EvidenceOpportunities items={items} state={state} dispatch={dispatch} />
    </div>
  );
}
function PanelTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Activity;
  title: string;
}) {
  return (
    <div className="panel-title">
      <Icon size={17} />
      <div>
        <span>INVESTIGATION TOOL</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
function Overview({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <div>
      <PanelTitle icon={Boxes} title="Incident overview" />
      <div className="overview-grid">
        <div>
          <span>STAGE</span>
          <strong>{playerVisibleStage(state)}</strong>
        </div>
        <div>
          <span>EVIDENCE</span>
          <strong>{state.collectedEvidence.length}</strong>
        </div>
        <div>
          <span>HYPOTHESES</span>
          <strong>{state.hypotheses.length}</strong>
        </div>
        <div>
          <span>ACTIONS</span>
          <strong>{state.actions.length}</strong>
        </div>
      </div>
      <Timeline state={state} dispatch={dispatch} />
      {canRevealConclusion(state) && (
        <div className="conclusion">
          <ShieldCheck size={18} />
          <div>
            <strong>Evidence threshold reached</strong>
            <p>
              Your evidence supports investigating whether order-service version
              2.14.7 fails to release database connections. Continue to validate
              before concluding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
function Timeline({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <section className="incident-timeline">
      <h3>Incident timeline</h3>
      <ol>
        {state.timeline.toReversed().map((entry) => (
          <li key={entry.id} className={entry.kind}>
            <time>
              T+{String(Math.floor(entry.second / 60)).padStart(2, "0")}:
              {String(entry.second % 60).padStart(2, "0")}
            </time>
            <div>
              <strong>{entry.title}</strong>
              <p>{entry.description}</p>
              {entry.title === "Deployment completed" && (
                <button
                  type="button"
                  className="timeline-link"
                  onClick={() =>
                    dispatch({
                      type: "CORRELATE",
                      tool: "deployments",
                      deploymentId: "deploy-order-2147",
                      service: "order",
                    })
                  }
                >
                  Open deployment marker
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
function MetricView({ state }: { state: SimulationState }) {
  const latest = state.metrics.at(-1)!;
  return (
    <div className="telemetry-view">
      <div className="metric-cards">
        <div>
          <span>ORDER P95</span>
          <strong>{latest.orderLatencyMs} ms</strong>
        </div>
        <div>
          <span>CHECKOUT ERRORS</span>
          <strong>{latest.checkoutErrorRate}%</strong>
        </div>
        <div>
          <span>DB POOL</span>
          <strong>
            {latest.dbPoolUsed}/{latest.dbPoolMax}
          </strong>
        </div>
      </div>
      <div
        className="metric-chart"
        role="img"
        aria-label={`Order latency history, latest ${latest.orderLatencyMs} milliseconds`}
      >
        {state.metrics.slice(-30).map((point) => (
          <i
            key={point.second}
            style={{
              height: `${Math.min(100, Math.max(5, point.orderLatencyMs / 32))}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
function LogView({ state }: { state: SimulationState }) {
  return (
    <div className="log-view mono">
      {state.logs.length ? (
        state.logs
          .toReversed()
          .slice(0, 20)
          .map((log) => (
            <p key={log.id}>
              <time>T+{log.second}s</time>
              <b className={log.level.toLowerCase()}>{log.level}</b>
              <span>{log.service}</span>
              {log.message}
            </p>
          ))
      ) : (
        <p>No anomalous logs in the current interval.</p>
      )}
    </div>
  );
}
function TraceView({ state }: { state: SimulationState }) {
  const latency = state.metrics.at(-1)!.orderLatencyMs;
  return (
    <div className="trace-view">
      <p>
        <strong>POST /checkout</strong>
        <span>{latency + 120} ms</span>
      </p>
      <p className="child">
        <strong>order.create</strong>
        <span>{latency} ms</span>
      </p>
      <p className="child deep">
        <strong>db.connection.acquire</strong>
        <span>{Math.max(12, latency - 75)} ms</span>
      </p>
      <p className="child deep">
        <strong>orders.insert</strong>
        <span>18 ms</span>
      </p>
    </div>
  );
}
function DeploymentView() {
  return (
    <div className="deployment-view">
      <span>23:42 UTC · COMPLETED</span>
      <h3>order-service v2.14.7</h3>
      <p>
        Rolling deployment from 2.14.6 · fictional build{" "}
        <span className="mono">bld_82f6c1</span>
      </p>
    </div>
  );
}
function AlertView({ state }: { state: SimulationState }) {
  const items = availableEvidence(state).filter(
    ({ source }) => source === "Alerts",
  );
  return (
    <div className="active-alerts">
      {items.length ? (
        items.map((item) => (
          <article key={item.id}>
            <AlertTriangle size={16} />
            <div>
              <strong>{item.summary}</strong>
              <p>
                {item.service} · {item.timestamp}
              </p>
            </div>
          </article>
        ))
      ) : (
        <p>No active alerts yet.</p>
      )}
    </div>
  );
}

function EvidenceOpportunities({
  items,
  state,
  dispatch,
}: {
  items: EvidenceDefinition[];
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  if (!items.length)
    return (
      <p className="no-evidence">
        Advance simulation time to reveal telemetry evidence.
      </p>
    );
  return (
    <section className="evidence-opportunities">
      <h3>Evidence opportunities</h3>
      {items.map((item) => {
        const collected = state.collectedEvidence.some(
          ({ id }) => id === item.id,
        );
        return (
          <article key={item.id}>
            <div>
              <span>
                {item.timestamp} · {item.service}
              </span>
              <p>{item.summary}</p>
            </div>
            <button
              type="button"
              disabled={collected}
              onClick={() =>
                dispatch({ type: "COLLECT_EVIDENCE", evidence: item })
              }
            >
              {collected ? "Collected" : "Collect evidence"}
            </button>
          </article>
        );
      })}
    </section>
  );
}

function EvidenceWorkspace({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div>
      <PanelTitle icon={BookMarked} title="Evidence & hypotheses" />
      <div className="evidence-layout">
        <section>
          <h3>Collected evidence</h3>
          {state.collectedEvidence.length ? (
            state.collectedEvidence.map((item) => (
              <article className="evidence-card" key={item.id}>
                <span>
                  {item.source} · {item.timestamp} · {item.service}
                </span>
                <strong>{item.summary}</strong>
                <dl>
                  {Object.entries(item.fields).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <label>
                  Player annotation
                  <textarea
                    aria-label={`Annotation for ${item.id}`}
                    value={item.annotation}
                    onChange={(event) =>
                      dispatch({
                        type: "ANNOTATE_EVIDENCE",
                        evidenceId: item.id,
                        annotation: event.target.value,
                      })
                    }
                  />
                </label>
                {state.hypotheses.length > 0 && (
                  <label>
                    Attach to hypothesis
                    <select
                      aria-label={`Attach ${item.id} to hypothesis`}
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value)
                          dispatch({
                            type: "ATTACH_EVIDENCE",
                            hypothesisId: event.target.value,
                            evidenceId: item.id,
                          });
                      }}
                    >
                      <option value="">Choose hypothesis</option>
                      {state.hypotheses.map((hypothesis) => (
                        <option key={hypothesis.id} value={hypothesis.id}>
                          {hypothesis.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </article>
            ))
          ) : (
            <p className="no-evidence">
              Collect items from logs, metrics, traces, deployments, or alerts.
            </p>
          )}
        </section>
        <section className="hypothesis-workspace">
          <h3>Hypothesis workspace</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (title.trim()) {
                dispatch({
                  type: "CREATE_HYPOTHESIS",
                  title: title.trim(),
                  notes: notes.trim(),
                });
                setTitle("");
                setNotes("");
              }
            }}
          >
            <label>
              Hypothesis
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What might explain the impact?"
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Why is this plausible?"
              />
            </label>
            <button className="button button-small" type="submit">
              <Plus size={14} /> Create hypothesis
            </button>
          </form>
          {state.hypotheses.map((hypothesis) => (
            <article className="hypothesis-card" key={hypothesis.id}>
              <strong>{hypothesis.title}</strong>
              <p>{hypothesis.notes || "No notes yet."}</p>
              <label>
                Status
                <select
                  aria-label={`Status for ${hypothesis.title}`}
                  value={hypothesis.status}
                  onChange={(event) =>
                    dispatch({
                      type: "SET_HYPOTHESIS_STATUS",
                      hypothesisId: hypothesis.id,
                      status: event.target.value as
                        "unresolved" | "supported" | "contradicted",
                    })
                  }
                >
                  <option value="unresolved">Unresolved</option>
                  <option value="supported">Supported</option>
                  <option value="contradicted">Contradicted</option>
                </select>
              </label>
              <small>
                {hypothesis.evidenceIds.length} attached evidence items
              </small>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function ActionPanel({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  const [pending, setPending] = useState<ActionId | null>(null);
  return (
    <div>
      <PanelTitle icon={ShieldCheck} title="Safe simulated actions" />
      <p className="panel-explainer">
        These controls update only local deterministic state. They never execute
        a command or contact a service.
      </p>
      <div className="action-grid">
        {Object.entries(actionDefinitions).map(([id, action]) => (
          <article key={id}>
            <h3>{action.label}</h3>
            <p>{action.risk}</p>
            <button
              type="button"
              onClick={() =>
                action.impactful
                  ? setPending(id as ActionId)
                  : dispatch({ type: "PERFORM_ACTION", action: id as ActionId })
              }
            >
              {action.impactful ? "Review action" : "Observe interval"}
            </button>
          </article>
        ))}
      </div>
      {state.actions.length > 0 && (
        <section className="action-history">
          <h3>Recorded actions</h3>
          {state.actions.toReversed().map((action) => (
            <p key={action.id}>
              <time>T+{action.second}s</time>
              <strong>{action.label}</strong>
              {action.effect}
            </p>
          ))}
        </section>
      )}
      <ConfirmDialog
        open={pending !== null}
        title={
          pending
            ? `Confirm: ${actionDefinitions[pending].label}`
            : "Confirm action"
        }
        description={pending ? actionDefinitions[pending].risk : ""}
        confirmLabel="Apply simulated action"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) dispatch({ type: "PERFORM_ACTION", action: pending });
          setPending(null);
        }}
      />
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  href,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm?: () => void;
  href?: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="confirm-dialog"
      >
        <AlertTriangle size={22} />
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description">{description}</p>
        <div>
          <button ref={cancelRef} type="button" onClick={onCancel}>
            Cancel
          </button>
          {href ? (
            <Link className="danger-action" href={href}>
              {confirmLabel}
            </Link>
          ) : (
            <button className="danger-action" type="button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function InvalidLocalSession() {
  return (
    <main id="main-content" className="invalid-session grid-bg">
      <ShieldCheck size={30} />
      <h1>Local session unavailable</h1>
      <p>
        This session is invalid, expired, or belongs to another tab. No
        investigation data was loaded.
      </p>
      <Link className="button" href="/scenarios/midnight-latency-incident">
        Return to briefing
      </Link>
    </main>
  );
}
