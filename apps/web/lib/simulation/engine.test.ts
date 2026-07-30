import {
  advanceSimulation,
  availableEvidence,
  createInitialState,
  playerVisibleStage,
  seedFromSession,
  simulationReducer,
  stageFor,
} from "./engine";
import { MAX_LOGS, MAX_METRICS } from "./scenario";

const session = "sim_0123456789abcdef0123456789abcdef";

describe("deterministic simulation engine", () => {
  it("derives a stable seed and deterministic replay", () => {
    expect(seedFromSession("scenario", session)).toBe(
      seedFromSession("scenario", session),
    );
    let first = createInitialState("scenario", session);
    let second = createInitialState("scenario", session);
    for (let index = 0; index < 8; index += 1) {
      first = advanceSimulation(first);
      second = advanceSimulation(second);
    }
    expect(first).toEqual(second);
  });

  it("moves through the explicit pre-mitigation stages", () => {
    expect(stageFor(0, null)).toBe("Normal");
    expect(stageFor(30, null)).toBe("Deployment completed");
    expect(stageFor(60, null)).toBe("Connection leak begins");
    expect(stageFor(90, null)).toBe("Database pool saturation");
    expect(stageFor(120, null)).toBe("Order-service latency increase");
    expect(stageFor(150, null)).toBe("Checkout errors");
  });

  it("does not reveal the connection-leak conclusion before enough evidence", () => {
    let state = createInitialState("scenario", session);
    state = advanceSimulation(advanceSimulation(state));
    expect(state.stage).toBe("Connection leak begins");
    expect(playerVisibleStage(state)).toBe("Early anomaly developing");
  });

  it("supports start, pause, resume, single-step, speed, and exact reset", () => {
    const initial = createInitialState("scenario", session);
    let state = simulationReducer(initial, { type: "START" });
    expect(state.status).toBe("running");
    state = simulationReducer(state, { type: "PAUSE" });
    expect(state.status).toBe("paused");
    state = simulationReducer(state, { type: "RESUME" });
    expect(state.status).toBe("running");
    state = simulationReducer(state, { type: "SET_SPEED", speed: 4 });
    expect(state.speed).toBe(4);
    state = simulationReducer(state, { type: "ADVANCE" });
    expect(state.elapsedSeconds).toBe(30);
    expect(simulationReducer(state, { type: "RESET" })).toEqual(initial);
  });

  it("bounds logs and metrics in long deterministic runs", () => {
    let state = createInitialState("scenario", session);
    for (let index = 0; index < 300; index += 1)
      state = advanceSimulation(state);
    expect(state.logs.length).toBeLessThanOrEqual(MAX_LOGS);
    expect(state.metrics.length).toBeLessThanOrEqual(MAX_METRICS);
  });

  it("collects evidence, creates hypotheses, and links both directions", () => {
    let state = createInitialState("scenario", session);
    for (let i = 0; i < 4; i += 1) state = advanceSimulation(state);
    const evidence = availableEvidence(state).find(
      ({ id }) => id === "ev-metric-pool",
    )!;
    state = simulationReducer(state, { type: "COLLECT_EVIDENCE", evidence });
    state = simulationReducer(state, {
      type: "CREATE_HYPOTHESIS",
      title: "Pool pressure",
      notes: "Needs validation",
    });
    state = simulationReducer(state, {
      type: "ATTACH_EVIDENCE",
      hypothesisId: "hyp-1",
      evidenceId: evidence.id,
    });
    expect(state.hypotheses[0]?.evidenceIds).toContain(evidence.id);
    expect(state.collectedEvidence[0]?.hypothesisIds).toContain("hyp-1");
  });

  it("records action effects and recovery timeline entries", () => {
    let state = createInitialState("scenario", session);
    for (let i = 0; i < 5; i += 1) state = advanceSimulation(state);
    state = simulationReducer(state, {
      type: "PERFORM_ACTION",
      action: "rollback",
    });
    expect(state.stage).toBe("Incident mitigation");
    expect(state.timeline.at(-1)?.title).toBe("Roll back deployment");
    state = advanceSimulation(advanceSimulation(state));
    expect(state.stage).toBe("Recovery");
    state = advanceSimulation(advanceSimulation(state));
    expect(state.stage).toBe("Completed");
  });
});
