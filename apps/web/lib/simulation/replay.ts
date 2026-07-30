import type { IncidentReport } from "./api-client";
import {
  advanceSimulation,
  initialStateFromSeed,
  simulationReducer,
} from "./engine";
import type { ActionId, AlertActionId, SimulationState } from "./types";

export const CLIENT_ENGINE_VERSION = "sentinelops-engine@1.0.0";
export const MIDNIGHT_SCENARIO_VERSION = "midnight-latency@1.0.0";
const ACTIONS = new Set<ActionId>([
  "restart",
  "scale",
  "rollback",
  "increase-pool",
  "disable-retry",
  "pause-consumer",
  "observe",
]);
const ALERT_ACTIONS = new Set<AlertActionId>([
  "ack-alert",
  "assign-alert",
  "silence-alert",
]);

export function replayReport(report: IncidentReport): {
  exact: boolean;
  warning: string | null;
  state: SimulationState;
} {
  const exact =
    report.replay.engineVersion === CLIENT_ENGINE_VERSION &&
    report.replay.scenarioVersion === MIDNIGHT_SCENARIO_VERSION;
  let state = initialStateFromSeed(report.scenario.id, report.replay.seed);
  state = { ...state, status: "paused" };
  for (const item of report.replay.actions) {
    while (state.elapsedSeconds < item.second) {
      state = { ...advanceSimulation(state), status: "paused" };
    }
    if (ACTIONS.has(item.action as ActionId))
      state = simulationReducer(state, {
        type: "PERFORM_ACTION",
        action: item.action as ActionId,
      });
    if (ALERT_ACTIONS.has(item.action as AlertActionId) && item.targetId)
      state = simulationReducer(state, {
        type: "UPDATE_ALERT",
        action: item.action as AlertActionId,
        alertId: item.targetId,
      });
  }
  return {
    exact,
    warning: exact
      ? null
      : "Exact replay is unavailable because the scenario or engine version differs from this client.",
    state,
  };
}
