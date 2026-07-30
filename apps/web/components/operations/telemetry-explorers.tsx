"use client";

import { deployments } from "@/lib/simulation/telemetry";
import {
  criticalPath,
  filterLogs,
  metricWindow,
  percentile,
  traceHierarchy,
} from "@/lib/simulation/telemetry";
import type {
  AlertRecord,
  EvidenceDefinition,
  LogEntry,
  MetricPoint,
  SimulationEvent,
  SimulationState,
  SpanRecord,
  TraceRecord,
} from "@/lib/simulation/types";
import {
  Activity,
  BellRing,
  Check,
  ChevronDown,
  Clipboard,
  ExternalLink,
  FileClock,
  FileText,
  GitCommitHorizontal,
  Pause,
  Play,
  Search,
} from "lucide-react";
import { memo, useMemo, useState } from "react";

type Props = {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
};
const serviceOptions = [
  { id: "all", name: "All services" },
  { id: "gateway", name: "API gateway" },
  { id: "order", name: "Order service" },
  { id: "orders-db", name: "Orders database" },
];
function evidenceFrom(
  source: EvidenceDefinition["source"],
  id: string,
  second: number,
  service: string,
  summary: string,
  fields: EvidenceDefinition["fields"],
): EvidenceDefinition {
  return {
    id: `ev-${source.toLowerCase()}-${id}`,
    source,
    availableAt: second,
    timestamp: `T+${second}s`,
    service,
    summary,
    fields,
  };
}

export const LogExplorer = memo(function LogExplorer({
  state,
  dispatch,
}: Props) {
  const [live, setLive] = useState(true);
  const [search, setSearch] = useState(state.correlation.traceId ?? "");
  const [service, setService] = useState(state.correlation.service ?? "all");
  const [severity, setSeverity] = useState("all");
  const [range, setRange] = useState("5m");
  const [field, setField] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<LogEntry[]>(state.logs);
  const sourceLogs = live ? state.logs : snapshot;
  const fromSecond =
    range === "all"
      ? undefined
      : state.elapsedSeconds - Number.parseInt(range, 10) * 60;
  const logs = useMemo(
    () =>
      filterLogs(sourceLogs, {
        search,
        service,
        severity,
        fromSecond,
        field,
        value: fieldValue,
      })
        .slice(-60)
        .toReversed(),
    [field, fieldValue, fromSecond, search, service, severity, sourceLogs],
  );
  return (
    <div className="explorer">
      <ExplorerHeader
        icon={FileText}
        title="Log explorer"
        simulated
        count={`${logs.length} visible / ${state.logs.length} bounded`}
      />
      <div className="explorer-controls">
        <button
          type="button"
          aria-pressed={!live}
          onClick={() => {
            if (live) setSnapshot(state.logs);
            setLive((value) => !value);
          }}
        >
          {live ? <Pause size={13} /> : <Play size={13} />}
          {live ? "Pause live tail" : "Resume live tail"}
        </button>
        <label>
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="message, trace, request…"
          />
        </label>
        <Select
          label="Service"
          value={service}
          setValue={(value) => {
            setService(value);
            dispatch({
              type: "CORRELATE",
              tool: "logs",
              service: value === "all" ? null : value,
            });
          }}
          options={serviceOptions.map(({ id, name }) => [id, name])}
        />
        <Select
          label="Severity"
          value={severity}
          setValue={setSeverity}
          options={[
            ["all", "All severities"],
            ["INFO", "Info"],
            ["WARN", "Warning"],
            ["ERROR", "Error"],
          ]}
        />
        <Select
          label="Time range"
          value={range}
          setValue={(value) => {
            setRange(value);
            dispatch({
              type: "CORRELATE",
              tool: "logs",
              timeRange:
                value === "all" ? "all" : value === "15m" ? "15m" : "5m",
            });
          }}
          options={[
            ["1m", "Last 1 min"],
            ["5m", "Last 5 min"],
            ["15m", "Last 15 min"],
            ["all", "All retained"],
          ]}
        />
        <label>
          Attribute
          <input
            value={field}
            onChange={(event) => setField(event.target.value)}
            placeholder="duration_ms"
          />
        </label>
        <label>
          Value
          <input
            value={fieldValue}
            onChange={(event) => setFieldValue(event.target.value)}
            placeholder="5000"
          />
        </label>
      </div>
      {logs.length ? (
        <div className="structured-logs" aria-label="Simulated structured logs">
          {logs.map((log) => (
            <article
              key={log.id}
              className={`structured-log ${log.level.toLowerCase()}`}
            >
              <button
                type="button"
                aria-expanded={expanded === log.id}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <time>
                  {new Date(log.timestamp).toISOString().slice(11, 19)}
                </time>
                <b>{log.level}</b>
                <span>{log.serviceName}</span>
                <code>{log.traceId.slice(0, 8)}</code>
                <strong>{log.message}</strong>
                <ChevronDown size={13} />
              </button>
              {expanded === log.id && (
                <div className="log-details">
                  <dl>
                    <Field name="service.name" value={log.serviceName} />
                    <Field name="trace_id" value={log.traceId} />
                    <Field name="span_id" value={log.spanId} />
                    <Field
                      name="deployment.version"
                      value={log.deploymentVersion}
                    />
                    <Field name="request_id" value={log.requestId} />
                    {Object.entries(log.fields).map(([key, value]) => (
                      <Field key={key} name={key} value={String(value)} />
                    ))}
                  </dl>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard?.writeText(
                          JSON.stringify(log, null, 2),
                        )
                      }
                    >
                      <Clipboard size={12} /> Copy safe details
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "COLLECT_EVIDENCE",
                          evidence: evidenceFrom(
                            "Logs",
                            log.id,
                            log.second,
                            log.serviceName,
                            log.message,
                            {
                              trace_id: log.traceId,
                              span_id: log.spanId,
                              ...log.fields,
                            },
                          ),
                        })
                      }
                    >
                      Add log as evidence
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "CORRELATE",
                          tool: "traces",
                          service: log.service,
                          traceId: log.traceId,
                        })
                      }
                    >
                      <ExternalLink size={12} /> Open trace
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState text="No simulated logs match the current filters." />
      )}
    </div>
  );
});

export const MetricsExplorer = memo(function MetricsExplorer({
  state,
  dispatch,
}: Props) {
  const [service, setService] = useState(state.correlation.service ?? "order");
  const [window, setWindow] = useState<"5m" | "15m" | "30m" | "all">(
    state.correlation.timeRange,
  );
  const [cursor, setCursor] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const points = useMemo(
    () => metricWindow(state.metrics, state.elapsedSeconds, window),
    [state.elapsedSeconds, state.metrics, window],
  );
  const latest = points.at(-1) ?? state.metrics.at(-1)!;
  const charts = [
    {
      key: "requestRate",
      label: "Request rate",
      unit: "req/min",
      threshold: 900,
    },
    { key: "checkoutErrorRate", label: "Error rate", unit: "%", threshold: 5 },
    { key: "orderLatencyMs", label: "Latency p95", unit: "ms", threshold: 900 },
    { key: "cpuPercent", label: "CPU", unit: "%", threshold: 80 },
    { key: "memoryMb", label: "Memory", unit: "MiB", threshold: 700 },
    {
      key: "dbPoolUsed",
      label: "Active DB connections",
      unit: "connections",
      threshold: 36,
    },
    {
      key: "dbPoolUtilizationPercent",
      label: "Database pool usage",
      unit: "%",
      threshold: 90,
    },
    {
      key: "queueDepth",
      label: "Queue depth",
      unit: "messages",
      threshold: 50,
    },
    {
      key: "serviceRestarts",
      label: "Service restarts",
      unit: "restarts",
      threshold: 2,
    },
  ] as const;
  return (
    <div className="explorer">
      <ExplorerHeader
        icon={Activity}
        title="Metrics dashboards"
        simulated
        count={`${points.length} retained samples`}
      />
      <div className="explorer-controls">
        <Select
          label="Service"
          value={service}
          setValue={(value) => {
            setService(value);
            dispatch({ type: "CORRELATE", tool: "metrics", service: value });
          }}
          options={serviceOptions.slice(1).map(({ id, name }) => [id, name])}
        />
        <Select
          label="Time window"
          value={window}
          setValue={(value) => {
            const next = value as typeof window;
            setWindow(next);
            dispatch({ type: "CORRELATE", tool: "metrics", timeRange: next });
          }}
          options={[
            ["5m", "5 minutes"],
            ["15m", "15 minutes"],
            ["30m", "30 minutes"],
            ["all", "All retained"],
          ]}
        />
        <button
          type="button"
          aria-pressed={table}
          onClick={() => setTable((value) => !value)}
        >
          {table ? "Show charts" : "Accessible data table"}
        </button>
      </div>
      <div className="metric-summary">
        <span>p50 {latest.latencyP50Ms} ms</span>
        <span>p95 {latest.orderLatencyMs} ms</span>
        <span>p99 {latest.latencyP99Ms} ms</span>
        <span>
          Pool {latest.dbPoolUsed}/{latest.dbPoolMax}
        </span>
      </div>
      {table ? (
        <MetricTable points={points} />
      ) : (
        <div className="dashboard-grid">
          {charts.map((chart) => (
            <MetricChart
              key={chart.key}
              points={points}
              metric={chart.key}
              label={chart.label}
              unit={chart.unit}
              threshold={chart.threshold}
              cursor={cursor}
              setCursor={setCursor}
              onEvidence={(point) =>
                dispatch({
                  type: "COLLECT_EVIDENCE",
                  evidence: evidenceFrom(
                    "Metrics",
                    `${chart.key}-${point.second}`,
                    point.second,
                    service,
                    `${chart.label} measured ${point[chart.key]} ${chart.unit} in the simulated interval.`,
                    {
                      metric: chart.key,
                      value: point[chart.key],
                      unit: chart.unit,
                      range: window,
                    },
                  ),
                })
              }
            />
          ))}
        </div>
      )}
      <div className="metric-annotations">
        <span>
          <i className="deployment-marker" /> Deployment v2.14.7 at T+30s
        </span>
        <span>
          <i className="threshold-marker" /> Alert thresholds shown as dashed
          markers
        </span>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "COLLECT_EVIDENCE",
              evidence: evidenceFrom(
                "Metrics",
                `range-${window}-${state.elapsedSeconds}`,
                state.elapsedSeconds,
                service,
                `Simulated ${window} metric range captured.`,
                {
                  p50_ms: percentile(
                    points.map(({ latencyP50Ms }) => latencyP50Ms),
                    50,
                  ),
                  p95_ms: percentile(
                    points.map(({ orderLatencyMs }) => orderLatencyMs),
                    95,
                  ),
                  samples: points.length,
                },
              ),
            })
          }
        >
          Add visible range as evidence
        </button>
      </div>
    </div>
  );
});

export const TraceExplorer = memo(function TraceExplorer({
  state,
  dispatch,
}: Props) {
  const [search, setSearch] = useState(state.correlation.traceId ?? "");
  const [service, setService] = useState(state.correlation.service ?? "all");
  const [minimum, setMinimum] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    state.correlation.traceId,
  );
  const [table, setTable] = useState(false);
  const traces = useMemo(
    () =>
      state.traces
        .filter(
          (trace) =>
            (!search || trace.id.includes(search)) &&
            (service === "all" ||
              trace.spans.some((span) => span.service === service)) &&
            trace.durationMs >= minimum,
        )
        .slice(-40)
        .toReversed(),
    [minimum, search, service, state.traces],
  );
  const selected =
    state.traces.find(({ id }) => id === selectedId) ?? traces[0];
  return (
    <div className="explorer">
      <ExplorerHeader
        icon={GitCommitHorizontal}
        title="Trace explorer"
        simulated
        count={`${traces.length} traces`}
      />
      <div className="explorer-controls">
        <label>
          Trace search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="trace ID"
          />
        </label>
        <Select
          label="Service"
          value={service}
          setValue={(value) => {
            setService(value);
            dispatch({
              type: "CORRELATE",
              tool: "traces",
              service: value === "all" ? null : value,
            });
          }}
          options={serviceOptions.map(({ id, name }) => [id, name])}
        />
        <label>
          Minimum duration
          <input
            type="number"
            min="0"
            step="100"
            value={minimum}
            onChange={(event) => setMinimum(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          aria-pressed={table}
          onClick={() => setTable((value) => !value)}
        >
          {table ? "Show waterfall" : "Accessible table"}
        </button>
      </div>
      {traces.length ? (
        <div className="trace-layout">
          <div className="trace-list" aria-label="Simulated traces">
            {traces.map((trace) => (
              <button
                type="button"
                key={trace.id}
                aria-pressed={selected?.id === trace.id}
                onClick={() => setSelectedId(trace.id)}
              >
                <code>{trace.id.slice(0, 12)}</code>
                <span>{trace.rootService}</span>
                <b className={trace.status.toLowerCase()}>{trace.status}</b>
                <strong>{trace.durationMs} ms</strong>
              </button>
            ))}
          </div>
          {selected &&
            (table ? (
              <SpanTable trace={selected} />
            ) : (
              <Waterfall trace={selected} dispatch={dispatch} />
            ))}
        </div>
      ) : (
        <EmptyState text="No simulated traces match the current filters." />
      )}
    </div>
  );
});

export const AlertCenter = memo(function AlertCenter({
  state,
  dispatch,
}: Props) {
  const alerts = state.alerts.filter(
    ({ firstTriggered }) => firstTriggered <= state.elapsedSeconds,
  );
  return (
    <div className="explorer">
      <ExplorerHeader
        icon={BellRing}
        title="Alert center"
        simulated
        count={`${alerts.length} active records`}
      />
      {alerts.length ? (
        <div className="alert-center">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} dispatch={dispatch} />
          ))}
        </div>
      ) : (
        <EmptyState text="No simulated alert has triggered in this time window." />
      )}
      <section className="alert-event-timeline">
        <h3>Alert timeline</h3>
        {state.timeline
          .filter(({ kind }) => kind === "alert" || kind === "action")
          .toReversed()
          .map((entry) => (
            <p key={entry.id}>
              <time>T+{entry.second}s</time>
              <strong>{entry.title}</strong>
              {entry.description}
            </p>
          ))}
      </section>
    </div>
  );
});

export const DeploymentExplorer = memo(function DeploymentExplorer({
  state,
  dispatch,
}: Props) {
  const selected = state.correlation.deploymentId;
  return (
    <div className="explorer">
      <ExplorerHeader
        icon={FileClock}
        title="Deployment history"
        simulated
        count={`${deployments.length} fictional changes`}
      />
      <div className="deployment-history">
        {deployments.map((deployment) => (
          <article
            key={deployment.id}
            className={selected === deployment.id ? "selected" : ""}
          >
            <header>
              <span className={`deployment-status ${deployment.status}`}>
                {deployment.status}
              </span>
              <time>
                {new Date(deployment.timestamp)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19)}{" "}
                UTC
              </time>
            </header>
            <h3>
              {deployment.service} <b>{deployment.version}</b>
            </h3>
            <p>{deployment.changeSummary}</p>
            <dl>
              <Field name="Previous" value={deployment.previousVersion} />
              <Field name="Reference" value={deployment.reference} />
              <Field
                name="Rollback"
                value={
                  deployment.rollbackAvailable ? "Available" : "Unavailable"
                }
              />
            </dl>
            <details>
              <summary>Deployment diff summary</summary>
              <ul>
                {deployment.diff.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
            <div>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "COLLECT_EVIDENCE",
                    evidence: evidenceFrom(
                      "Deployments",
                      deployment.id,
                      deployment.second,
                      deployment.service,
                      `${deployment.service} ${deployment.version} deployment recorded.`,
                      {
                        version: deployment.version,
                        previous: deployment.previousVersion,
                        reference: deployment.reference,
                        status: deployment.status,
                      },
                    ),
                  })
                }
              >
                Add deployment as evidence
              </button>
              {deployment.rollbackAvailable && (
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: "SET_TOOL", tool: "actions" })
                  }
                >
                  Review rollback action
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
});

function ExplorerHeader({
  icon: Icon,
  title,
  count,
  simulated = true,
}: {
  icon: typeof Activity;
  title: string;
  count: string;
  simulated?: boolean;
}) {
  return (
    <div className="explorer-header">
      <Icon size={17} />
      <div>
        <span>OBSERVABILITY TOOL</span>
        <h2>{title}</h2>
      </div>
      <p>
        <b>{simulated ? "SIMULATED" : ""}</b>
        {count}
      </p>
    </div>
  );
}
function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[][];
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => setValue(event.target.value)}>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Field({ name, value }: { name: string; value: string }) {
  return (
    <div>
      <dt>{name}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="telemetry-empty">
      <Search size={18} />
      <p>{text}</p>
    </div>
  );
}

function MetricChart({
  points,
  metric,
  label,
  unit,
  threshold,
  cursor,
  setCursor,
  onEvidence,
}: {
  points: MetricPoint[];
  metric: keyof MetricPoint;
  label: string;
  unit: string;
  threshold: number;
  cursor: number | null;
  setCursor: (second: number | null) => void;
  onEvidence: (point: MetricPoint) => void;
}) {
  const max = Math.max(
    threshold,
    ...points.map((point) => Number(point[metric])),
  );
  const selected =
    points.find(({ second }) => second === cursor) ?? points.at(-1);
  return (
    <article className="professional-chart">
      <header>
        <div>
          <span>{label}</span>
          <strong>
            {selected ? `${selected[metric]} ${unit}` : "No data"}
          </strong>
        </div>
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onEvidence(selected)}
        >
          Add point as evidence
        </button>
      </header>
      <div
        className="chart-plot"
        role="img"
        aria-label={`Simulated ${label}, latest ${selected?.[metric] ?? 0} ${unit}, alert threshold ${threshold} ${unit}`}
        onMouseLeave={() => setCursor(null)}
      >
        <i
          className="chart-threshold"
          style={{ bottom: `${Math.min(100, (threshold / max) * 100)}%` }}
        />
        {points.map((point) => (
          <button
            aria-label={`${label} at T plus ${point.second} seconds: ${point[metric]} ${unit}`}
            key={point.second}
            style={{
              height: `${Math.max(3, (Number(point[metric]) / max) * 100)}%`,
            }}
            className={cursor === point.second ? "cursor" : ""}
            onFocus={() => setCursor(point.second)}
            onMouseEnter={() => setCursor(point.second)}
            type="button"
          />
        ))}
        {points.some(({ second }) => second === 30) && (
          <i className="chart-deployment" title="Deployment marker at T+30s" />
        )}
      </div>
    </article>
  );
}
function MetricTable({ points }: { points: MetricPoint[] }) {
  return (
    <div className="accessible-table">
      <table>
        <caption>Simulated metric samples for the selected time window</caption>
        <thead>
          <tr>
            <th>Time</th>
            <th>Requests/min</th>
            <th>Error %</th>
            <th>p50 ms</th>
            <th>p95 ms</th>
            <th>p99 ms</th>
            <th>CPU %</th>
            <th>Memory MiB</th>
            <th>DB pool</th>
            <th>Pool usage %</th>
            <th>Queue</th>
            <th>Restarts</th>
          </tr>
        </thead>
        <tbody>
          {points
            .toReversed()
            .slice(0, 40)
            .map((point) => (
              <tr key={point.second}>
                <td>T+{point.second}s</td>
                <td>{point.requestRate}</td>
                <td>{point.checkoutErrorRate}</td>
                <td>{point.latencyP50Ms}</td>
                <td>{point.orderLatencyMs}</td>
                <td>{point.latencyP99Ms}</td>
                <td>{point.cpuPercent}</td>
                <td>{point.memoryMb}</td>
                <td>
                  {point.dbPoolUsed}/{point.dbPoolMax}
                </td>
                <td>{point.dbPoolUtilizationPercent}</td>
                <td>{point.queueDepth}</td>
                <td>{point.serviceRestarts}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Waterfall({
  trace,
  dispatch,
}: {
  trace: TraceRecord;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  const max = trace.durationMs;
  const hierarchy = traceHierarchy(trace);
  return (
    <div className="waterfall">
      <header>
        <div>
          <code>{trace.id}</code>
          <strong>
            {trace.durationMs} ms · {trace.status}
          </strong>
        </div>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "CORRELATE",
              tool: "logs",
              traceId: trace.id,
              service: null,
            })
          }
        >
          Open related logs
        </button>
      </header>
      <p className="critical-legend">
        Critical path:{" "}
        {criticalPath(trace)
          .map(({ name }) => name)
          .join(" → ")}
      </p>
      {renderSpanTree(hierarchy, null, 0, max, dispatch, trace)}
    </div>
  );
}
function renderSpanTree(
  hierarchy: Map<string | null, SpanRecord[]>,
  parent: string | null,
  depth: number,
  max: number,
  dispatch: React.Dispatch<SimulationEvent>,
  trace: TraceRecord,
): React.ReactNode {
  return hierarchy.get(parent)?.map((span) => (
    <div key={span.id}>
      <article className={`waterfall-span ${span.critical ? "critical" : ""}`}>
        <button
          type="button"
          aria-label={`${span.name}, ${span.durationMs} milliseconds, ${span.status}`}
          style={{ marginLeft: depth * 13 }}
        >
          <span>{span.service}</span>
          <strong>{span.name}</strong>
          <small>{span.durationMs} ms</small>
        </button>
        <i
          style={{
            left: `${(span.startMs / max) * 100}%`,
            width: `${Math.max(2, (span.durationMs / max) * 100)}%`,
          }}
        />
        <details>
          <summary>Span attributes</summary>
          <dl>
            {Object.entries(span.attributes).map(([key, value]) => (
              <Field key={key} name={key} value={String(value)} />
            ))}
          </dl>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "COLLECT_EVIDENCE",
                evidence: evidenceFrom(
                  "Traces",
                  `${trace.id}-${span.id}`,
                  trace.second,
                  span.service,
                  `${span.name} consumed ${span.durationMs} ms in a simulated trace.`,
                  {
                    trace_id: trace.id,
                    span_id: span.id,
                    duration_ms: span.durationMs,
                    status: span.status,
                    ...span.attributes,
                  },
                ),
              })
            }
          >
            Add span as evidence
          </button>
          {span.relatedLogIds.length > 0 && (
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "CORRELATE",
                  tool: "logs",
                  traceId: trace.id,
                  service: span.service,
                })
              }
            >
              Related logs
            </button>
          )}
        </details>
      </article>
      {renderSpanTree(hierarchy, span.id, depth + 1, max, dispatch, trace)}
    </div>
  ));
}
function SpanTable({ trace }: { trace: TraceRecord }) {
  return (
    <div className="accessible-table">
      <table>
        <caption>Span hierarchy for simulated trace {trace.id}</caption>
        <thead>
          <tr>
            <th>Span</th>
            <th>Parent</th>
            <th>Service</th>
            <th>Start ms</th>
            <th>Duration ms</th>
            <th>Status</th>
            <th>Critical path</th>
          </tr>
        </thead>
        <tbody>
          {trace.spans.map((span) => (
            <tr key={span.id}>
              <td>{span.name}</td>
              <td>{span.parentId ?? "root"}</td>
              <td>{span.service}</td>
              <td>{span.startMs}</td>
              <td>{span.durationMs}</td>
              <td>{span.status}</td>
              <td>{span.critical ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function AlertCard({
  alert,
  dispatch,
}: {
  alert: AlertRecord;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  return (
    <article>
      <header>
        <span className={`alert-severity ${alert.severity}`}>
          {alert.severity}
        </span>
        <span className={`alert-state ${alert.status}`}>{alert.status}</span>
      </header>
      <h3>{alert.title}</h3>
      <p>
        {alert.source} · {alert.service}
      </p>
      <dl>
        <Field name="First triggered" value={`T+${alert.firstTriggered}s`} />
        <Field name="Last updated" value={`T+${alert.lastUpdated}s`} />
        <Field name="Threshold" value={alert.threshold} />
        <Field name="Assigned" value={alert.assignedTo ?? "Unassigned"} />
      </dl>
      <div>
        <button
          type="button"
          disabled={alert.status === "acknowledged"}
          onClick={() =>
            dispatch({
              type: "UPDATE_ALERT",
              alertId: alert.id,
              action: "ack-alert",
            })
          }
        >
          <Check size={12} /> Acknowledge
        </button>
        <button
          type="button"
          disabled={alert.assignedTo === "self"}
          onClick={() =>
            dispatch({
              type: "UPDATE_ALERT",
              alertId: alert.id,
              action: "assign-alert",
            })
          }
        >
          Assign to self
        </button>
        <button
          type="button"
          disabled={alert.status === "silenced"}
          onClick={() =>
            dispatch({
              type: "UPDATE_ALERT",
              alertId: alert.id,
              action: "silence-alert",
            })
          }
        >
          Silence in simulation
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "CORRELATE",
              tool: alert.telemetryTool,
              service: alert.service,
              timeRange: "5m",
            })
          }
        >
          <ExternalLink size={12} /> Open {alert.telemetryTool}
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "COLLECT_EVIDENCE",
              evidence: evidenceFrom(
                "Alerts",
                alert.id,
                alert.firstTriggered,
                alert.service,
                alert.title,
                {
                  severity: alert.severity,
                  source: alert.source,
                  threshold: alert.threshold,
                  status: alert.status,
                },
              ),
            })
          }
        >
          Add alert as evidence
        </button>
      </div>
    </article>
  );
}
