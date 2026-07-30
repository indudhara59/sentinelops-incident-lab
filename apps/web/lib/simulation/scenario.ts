import type { ActionId, EvidenceDefinition } from "./types";

export const SIMULATION_INTERVAL_SECONDS = 30;
export const MAX_LOGS = 100;
export const MAX_METRICS = 120;

export const topology = [
  {
    id: "web",
    name: "Web frontend",
    type: "Frontend",
    dependencies: ["gateway"],
  },
  {
    id: "gateway",
    name: "API gateway",
    type: "Gateway",
    dependencies: ["auth", "catalog", "cart", "order"],
  },
  {
    id: "auth",
    name: "Authentication service",
    type: "Application",
    dependencies: [],
  },
  {
    id: "catalog",
    name: "Catalog service",
    type: "Application",
    dependencies: [],
  },
  {
    id: "cart",
    name: "Cart service",
    type: "Application",
    dependencies: ["order"],
  },
  {
    id: "order",
    name: "Order service",
    type: "Application",
    dependencies: ["orders-db", "queue", "payment"],
  },
  {
    id: "payment",
    name: "Payment service",
    type: "Application",
    dependencies: [],
  },
  {
    id: "notification",
    name: "Notification service",
    type: "Worker",
    dependencies: ["queue"],
  },
  {
    id: "orders-db",
    name: "PostgreSQL-compatible orders database",
    type: "Database",
    dependencies: [],
  },
  {
    id: "queue",
    name: "Message queue",
    type: "Message queue",
    dependencies: ["notification"],
  },
] as const;

export const evidenceCatalog: readonly EvidenceDefinition[] = [
  {
    id: "ev-deploy-2147",
    source: "Deployments",
    availableAt: 30,
    timestamp: "23:42:00 UTC",
    service: "Order service",
    summary:
      "Order service version 2.14.7 completed deployment shortly before impact.",
    fields: { version: "2.14.7", previous: "2.14.6", strategy: "rolling" },
  },
  {
    id: "ev-alert-latency",
    source: "Alerts",
    availableAt: 120,
    timestamp: "23:50:00 UTC",
    service: "Order service",
    summary: "Order-service latency SLO is burning rapidly.",
    fields: { p95_ms: 2840, threshold_ms: 900 },
  },
  {
    id: "ev-metric-pool",
    source: "Metrics",
    availableAt: 90,
    timestamp: "23:48:00 UTC",
    service: "PostgreSQL-compatible orders database",
    summary:
      "Active connections rise to the configured pool ceiling while traffic remains stable.",
    fields: { active: 40, maximum: 40, request_rate: "stable" },
  },
  {
    id: "ev-log-timeout",
    source: "Logs",
    availableAt: 120,
    timestamp: "23:50:30 UTC",
    service: "Order service",
    summary: "Requests wait for database connections and time out.",
    fields: {
      event: "pool_acquire_timeout",
      wait_ms: 5000,
      pool: "orders-primary",
    },
  },
  {
    id: "ev-trace-wait",
    source: "Traces",
    availableAt: 120,
    timestamp: "23:51:10 UTC",
    service: "Order service",
    summary:
      "Checkout traces spend most of their duration waiting before an orders database query begins.",
    fields: { span: "db.connection.acquire", duration_ms: 2710, query_ms: 18 },
  },
  {
    id: "ev-alert-checkout",
    source: "Alerts",
    availableAt: 150,
    timestamp: "23:52:00 UTC",
    service: "API gateway",
    summary: "Checkout error rate crosses the critical threshold.",
    fields: { error_rate: "12.8%", threshold: "5%" },
  },
] as const;

export const actionDefinitions: Record<
  ActionId,
  { label: string; risk: string; impactful: boolean }
> = {
  restart: {
    label: "Restart service",
    risk: "Briefly removes an instance and may interrupt in-flight requests.",
    impactful: true,
  },
  scale: {
    label: "Scale service",
    risk: "Adds simulated capacity but may mask the underlying fault.",
    impactful: true,
  },
  rollback: {
    label: "Roll back deployment",
    risk: "Replaces the current order-service version and may briefly reduce capacity.",
    impactful: true,
  },
  "increase-pool": {
    label: "Increase database pool temporarily",
    risk: "Raises database connection pressure and is only a temporary mitigation.",
    impactful: true,
  },
  "disable-retry": {
    label: "Disable retry behavior",
    risk: "Reduces amplification but some requests will fail without retry.",
    impactful: true,
  },
  "pause-consumer": {
    label: "Pause message consumer",
    risk: "Notification backlog will grow while consumption is paused.",
    impactful: true,
  },
  observe: {
    label: "Do nothing and observe",
    risk: "Impact may worsen while more evidence becomes available.",
    impactful: false,
  },
};
