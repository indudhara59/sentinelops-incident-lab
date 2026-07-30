import {
  advanceSimulation,
  createInitialState,
  simulationReducer,
} from "./engine";
import { MAX_LOGS, MAX_METRICS, MAX_TRACES } from "./scenario";
import {
  createTrace,
  criticalPath,
  deployments,
  filterLogs,
  metricWindow,
  percentile,
  traceHierarchy,
} from "./telemetry";

const session = "sim_0123456789abcdef0123456789abcdef";
function advancedState(steps = 6) {
  let state = createInitialState("scenario", session);
  for (let index = 0; index < steps; index += 1)
    state = advanceSimulation(state);
  return state;
}

describe("professional telemetry model", () => {
  it("filters logs by search, service, severity, time, and structured fields", () => {
    const state = advancedState();
    expect(
      filterLogs(state.logs, { search: "acquisition timed out" }).every(
        ({ service }) => service === "order",
      ),
    ).toBe(true);
    expect(
      filterLogs(state.logs, { service: "gateway" }).every(
        ({ service }) => service === "gateway",
      ),
    ).toBe(true);
    expect(
      filterLogs(state.logs, { severity: "ERROR" }).every(
        ({ level }) => level === "ERROR",
      ),
    ).toBe(true);
    expect(
      filterLogs(state.logs, { fromSecond: 150 }).every(
        ({ second }) => second >= 150,
      ),
    ).toBe(true);
    expect(
      filterLogs(state.logs, { field: "deployment.version", value: "2.14.7" })
        .length,
    ).toBeGreaterThan(0);
  });

  it("uses safe OpenTelemetry-compatible fields", () => {
    const log = advancedState(2).logs[0]!;
    expect(log.traceId).toMatch(/^[a-f0-9]{32}$/);
    expect(log.spanId).toMatch(/^[a-f0-9]{16}$/);
    expect(log.fields["service.name"]).toBeTruthy();
    expect(log.fields["sentinelops.simulated"]).toBe(true);
    expect(JSON.stringify(log)).not.toMatch(/password|secret|credential/i);
  });

  it("calculates percentiles without impossible interpolation and slices time ranges", () => {
    expect(percentile([100, 200, 300, 400], 50)).toBe(200);
    expect(percentile([100, 200, 300, 400], 95)).toBe(400);
    const state = advancedState(20);
    const points = metricWindow(state.metrics, state.elapsedSeconds, "5m");
    expect(
      points.every(({ second }) => second >= state.elapsedSeconds - 300),
    ).toBe(true);
    expect(
      metricWindow(state.metrics, state.elapsedSeconds, "all"),
    ).toHaveLength(state.metrics.length);
  });

  it("builds a parent-child trace hierarchy and deterministic critical path", () => {
    const trace = createTrace(42, 5, 150, 2500, 12.8);
    const hierarchy = traceHierarchy(trace);
    expect(hierarchy.get(null)?.[0]?.name).toBe("POST /checkout");
    expect(
      hierarchy.get(trace.spans[0]!.id)?.map(({ name }) => name),
    ).toContain("order.create");
    expect(criticalPath(trace).map(({ name }) => name)).toEqual([
      "POST /checkout",
      "order.create",
      "db.connection.acquire",
      "orders.insert",
    ]);
  });

  it("records alert acknowledgement and cross-tool correlation without deleting evidence", () => {
    let state = advancedState(5);
    const evidenceCount = state.collectedEvidence.length;
    state = simulationReducer(state, {
      type: "UPDATE_ALERT",
      alertId: "alert-order-latency",
      action: "ack-alert",
    });
    expect(
      state.alerts.find(({ id }) => id === "alert-order-latency")?.status,
    ).toBe("acknowledged");
    expect(state.actions.at(-1)?.action).toBe("ack-alert");
    expect(state.collectedEvidence).toHaveLength(evidenceCount);
    state = simulationReducer(state, {
      type: "CORRELATE",
      tool: "logs",
      service: "order",
      traceId: "abc",
    });
    expect(state.activeTool).toBe("logs");
    expect(state.correlation).toMatchObject({
      service: "order",
      traceId: "abc",
    });
  });

  it("includes a fictional order deployment marker and bounds every telemetry array", () => {
    expect(
      deployments.find(({ id }) => id === "deploy-order-2147"),
    ).toMatchObject({
      second: 30,
      reference: "sim-a82f6c1",
      rollbackAvailable: true,
    });
    let state = createInitialState("scenario", session);
    for (let index = 0; index < 300; index += 1)
      state = advanceSimulation(state);
    expect(state.logs.length).toBeLessThanOrEqual(MAX_LOGS);
    expect(state.metrics.length).toBeLessThanOrEqual(MAX_METRICS);
    expect(state.traces.length).toBeLessThanOrEqual(MAX_TRACES);
  });
});
