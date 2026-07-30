"use client";

import { useEffect, useReducer } from "react";
import { createInitialState, simulationReducer } from "./engine";

export function useSimulation(scenarioId: string, sessionId: string) {
  const [state, dispatch] = useReducer(simulationReducer, undefined, () =>
    createInitialState(scenarioId, sessionId),
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
