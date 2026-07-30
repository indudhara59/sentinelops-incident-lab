"use client";

import { useEffect, useReducer } from "react";
import { createInitialState, simulationReducer } from "./engine";
import type { CorrelationContext, ToolId } from "./types";

export function useSimulation(
  scenarioId: string,
  sessionId: string,
  initial?: Partial<CorrelationContext> & { tool?: ToolId },
) {
  const [state, dispatch] = useReducer(simulationReducer, undefined, () =>
    initial
      ? simulationReducer(createInitialState(scenarioId, sessionId), {
          type: "CORRELATE",
          tool: initial.tool ?? "overview",
          ...(initial.service !== undefined
            ? { service: initial.service }
            : {}),
          ...(initial.traceId !== undefined
            ? { traceId: initial.traceId }
            : {}),
          ...(initial.deploymentId !== undefined
            ? { deploymentId: initial.deploymentId }
            : {}),
          ...(initial.timeRange !== undefined
            ? { timeRange: initial.timeRange }
            : {}),
        })
      : createInitialState(scenarioId, sessionId),
  );
  useEffect(() => {
    if (state.status !== "running") return;
    const timer = window.setInterval(
      () => dispatch({ type: "ADVANCE" }),
      1000 / state.speed,
    );
    return () => window.clearInterval(timer);
  }, [state.speed, state.status]);
  return { state, dispatch };
}
