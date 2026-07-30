import type {
  AlertRecord,
  DeploymentRecord,
  LogEntry,
  MetricPoint,
  SpanRecord,
  TraceRecord,
} from "./types";

export const SIMULATION_START_MS = Date.parse("2026-02-14T23:42:00Z");
export function telemetryTimestamp(second: number): string {
  return new Date(SIMULATION_START_MS + second * 1000).toISOString();
}
export function telemetryHex(
  seed: number,
  tick: number,
  length: number,
  salt = 0,
): string {
  let result = "";
  let value = (seed ^ Math.imul(tick + 1, 2654435761) ^ salt) >>> 0;
  while (result.length < length) {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    result += (value >>> 0).toString(16).padStart(8, "0");
  }
  return result.slice(0, length);
}

export function percentile(values: readonly number[], rank: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((rank / 100) * sorted.length) - 1),
  );
  return sorted[index]!;
}
export function metricWindow(
  points: readonly MetricPoint[],
  currentSecond: number,
  window: "5m" | "15m" | "30m" | "all",
): MetricPoint[] {
  if (window === "all") return [...points];
  const seconds = Number.parseInt(window, 10) * 60;
  return points.filter((point) => point.second >= currentSecond - seconds);
}
export function filterLogs(
  logs: readonly LogEntry[],
  filters: {
    search?: string;
    service?: string;
    severity?: string;
    fromSecond?: number | undefined;
    field?: string;
    value?: string;
  },
): LogEntry[] {
  const query = filters.search?.trim().toLowerCase();
  return logs.filter(
    (log) =>
      (!query ||
        `${log.message} ${log.traceId} ${log.requestId} ${JSON.stringify(log.fields)}`
          .toLowerCase()
          .includes(query)) &&
      (!filters.service ||
        filters.service === "all" ||
        log.service === filters.service) &&
      (!filters.severity ||
        filters.severity === "all" ||
        log.level === filters.severity) &&
      (filters.fromSecond === undefined || log.second >= filters.fromSecond) &&
      (!filters.field ||
        !filters.value ||
        String(log.fields[filters.field] ?? "")
          .toLowerCase()
          .includes(filters.value.toLowerCase())),
  );
}

export function createTrace(
  seed: number,
  tick: number,
  second: number,
  latencyMs: number,
  errorRate: number,
): TraceRecord {
  const id = telemetryHex(seed, tick, 32, 17);
  const gateway = 24;
  const auth = 18;
  const order = Math.max(65, latencyMs);
  const wait = Math.max(12, order - 72);
  const query = 18;
  const spans: SpanRecord[] = [
    {
      id: telemetryHex(seed, tick, 16, 1),
      parentId: null,
      name: "POST /checkout",
      service: "gateway",
      startMs: 0,
      durationMs: gateway + order,
      status: errorRate >= 5 ? "ERROR" : "OK",
      attributes: {
        "http.request.method": "POST",
        "http.route": "/checkout",
        "server.address": "simulated.internal",
      },
      critical: true,
      relatedLogIds: [`log-${tick}-order`],
    },
    {
      id: telemetryHex(seed, tick, 16, 2),
      parentId: telemetryHex(seed, tick, 16, 1),
      name: "auth.validate",
      service: "auth",
      startMs: 3,
      durationMs: auth,
      status: "OK",
      attributes: { "rpc.system": "http", "sentinelops.simulated": true },
      critical: false,
      relatedLogIds: [],
    },
    {
      id: telemetryHex(seed, tick, 16, 3),
      parentId: telemetryHex(seed, tick, 16, 1),
      name: "order.create",
      service: "order",
      startMs: 22,
      durationMs: order,
      status: errorRate >= 5 ? "ERROR" : "OK",
      attributes: {
        "deployment.version": "2.14.7",
        "service.name": "order-service",
      },
      critical: true,
      relatedLogIds: [`log-${tick}-order`],
    },
    {
      id: telemetryHex(seed, tick, 16, 4),
      parentId: telemetryHex(seed, tick, 16, 3),
      name: "db.connection.acquire",
      service: "orders-db",
      startMs: 28,
      durationMs: wait,
      status: wait > 1000 ? "ERROR" : "OK",
      attributes: {
        "db.system": "postgresql",
        "db.namespace": "orders",
        "pool.name": "orders-primary",
      },
      critical: true,
      relatedLogIds: [`log-${tick}-order`],
    },
    {
      id: telemetryHex(seed, tick, 16, 5),
      parentId: telemetryHex(seed, tick, 16, 3),
      name: "orders.insert",
      service: "orders-db",
      startMs: 28 + wait,
      durationMs: query,
      status: "OK",
      attributes: { "db.operation.name": "INSERT", "db.system": "postgresql" },
      critical: true,
      relatedLogIds: [],
    },
  ];
  return {
    id,
    second,
    timestamp: telemetryTimestamp(second),
    rootService: "gateway",
    durationMs: gateway + order,
    status: errorRate >= 5 ? "ERROR" : "OK",
    spans,
  };
}
export function traceHierarchy(
  trace: TraceRecord,
): Map<string | null, SpanRecord[]> {
  const hierarchy = new Map<string | null, SpanRecord[]>();
  for (const span of trace.spans)
    hierarchy.set(span.parentId, [
      ...(hierarchy.get(span.parentId) ?? []),
      span,
    ]);
  return hierarchy;
}
export function criticalPath(trace: TraceRecord): SpanRecord[] {
  return trace.spans
    .filter(({ critical }) => critical)
    .sort((a, b) => a.startMs - b.startMs);
}

export const initialAlerts: AlertRecord[] = [
  {
    id: "alert-db-pool",
    title: "Orders database pool utilization",
    severity: "warning",
    source: "Simulated threshold monitor",
    service: "orders-db",
    firstTriggered: 90,
    lastUpdated: 90,
    status: "firing",
    assignedTo: null,
    telemetryTool: "metrics",
    metric: "db.pool.utilization",
    threshold: "> 90% for 2 intervals",
  },
  {
    id: "alert-order-latency",
    title: "Order-service latency SLO burn",
    severity: "critical",
    source: "Simulated SLO monitor",
    service: "order",
    firstTriggered: 120,
    lastUpdated: 120,
    status: "firing",
    assignedTo: null,
    telemetryTool: "metrics",
    metric: "http.server.duration.p95",
    threshold: "> 900 ms",
  },
  {
    id: "alert-checkout-errors",
    title: "Checkout error rate",
    severity: "critical",
    source: "Simulated error monitor",
    service: "gateway",
    firstTriggered: 150,
    lastUpdated: 150,
    status: "firing",
    assignedTo: null,
    telemetryTool: "logs",
    metric: "http.server.error_rate",
    threshold: "> 5%",
  },
];
export const deployments: DeploymentRecord[] = [
  {
    id: "deploy-order-2147",
    service: "order",
    version: "2.14.7",
    previousVersion: "2.14.6",
    second: 30,
    timestamp: telemetryTimestamp(30),
    status: "completed",
    changeSummary:
      "Connection handling and order validation maintenance update.",
    reference: "sim-a82f6c1",
    diff: [
      "Updated database client lifecycle",
      "Refactored order validation error handling",
      "No schema changes",
    ],
    rollbackAvailable: true,
  },
  {
    id: "deploy-catalog-891",
    service: "catalog",
    version: "8.9.1",
    previousVersion: "8.9.0",
    second: -720,
    timestamp: telemetryTimestamp(-720),
    status: "completed",
    changeSummary: "Catalog cache refresh optimization.",
    reference: "sim-49ce20b",
    diff: ["Reduced cache refresh overlap", "No checkout-path changes"],
    rollbackAvailable: false,
  },
];
