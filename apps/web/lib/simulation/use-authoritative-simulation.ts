"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalSessionRecord } from "@/lib/local-session";
import {
  fetchSnapshot,
  patchHypothesis,
  completeIncident,
  sendAction,
  sendEvidence,
  sendHypothesis,
  submitRootCause,
  sessionCommand,
  streamUrl,
  verifyRecovery,
  type ApiSnapshot,
  type ConnectionStatus,
  type StreamEnvelope,
} from "./api-client";
import type {
  CorrelationContext,
  SimulationEvent,
  SimulationState,
  ToolId,
} from "./types";
import { useSimulation } from "./use-simulation";

const SERVER_FIELDS = [
  "seed",
  "elapsedSeconds",
  "tick",
  "stage",
  "status",
  "speed",
  "logs",
  "metrics",
  "traces",
  "alerts",
  "timeline",
  "collectedEvidence",
  "hypotheses",
  "actions",
  "mitigationAt",
  "modifiers",
  "rootCauseSubmission",
  "recoveryVerification",
  "completionDocumentation",
  "investigationCompleted",
] as const;

function stateFromSnapshot(snapshot: ApiSnapshot): Partial<SimulationState> {
  const result: Record<string, unknown> = {};
  for (const field of SERVER_FIELDS) {
    if (field in snapshot) result[field] = snapshot[field];
  }
  return result as Partial<SimulationState>;
}

function idempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `request-${Date.now()}`;
}

export function useAuthoritativeSimulation(
  scenarioId: string,
  sessionId: string,
  record: LocalSessionRecord | null,
  initial?: Partial<CorrelationContext> & { tool?: ToolId },
) {
  const { state, dispatch: localDispatch } = useSimulation(
    scenarioId,
    sessionId,
    initial,
    record?.execution !== "api",
  );
  const [connection, setConnection] = useState<ConnectionStatus>(
    record?.execution === "api" ? "connecting" : "local-fallback",
  );
  const [lastSynchronized, setLastSynchronized] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const sequence = useRef(0);
  const reconnects = useRef(0);
  const polling = useRef<number | null>(null);

  const applySnapshot = useCallback(
    (snapshot: ApiSnapshot) => {
      if ((snapshot.sequence ?? 0) < sequence.current) return;
      localDispatch({
        type: "APPLY_SERVER_SNAPSHOT",
        snapshot: stateFromSnapshot(snapshot),
      });
      sequence.current = Math.max(sequence.current, snapshot.sequence ?? 0);
      setLastSynchronized(new Date().toISOString());
    },
    [localDispatch],
  );

  useEffect(() => {
    if (record?.execution !== "api") return;
    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const consume = (event: StreamEnvelope) => {
      if (event.sequence <= sequence.current && event.type !== "snapshot")
        return;
      const snapshot = event.payload.snapshot;
      if (snapshot) applySnapshot(snapshot);
      sequence.current = Math.max(sequence.current, event.sequence);
    };
    const beginPolling = () => {
      if (polling.current !== null || closed) return;
      setConnection("polling");
      polling.current = window.setInterval(async () => {
        try {
          const result = await fetchSnapshot(sessionId, sequence.current);
          if (closed) return;
          for (const event of result.events) consume(event);
          applySnapshot(result.snapshot);
          setConnection("polling");
        } catch {
          if (!closed) setConnection("unavailable");
        }
      }, 3_000);
    };
    const connect = async () => {
      setConnection(reconnects.current ? "reconnecting" : "connecting");
      try {
        const result = await fetchSnapshot(sessionId, sequence.current);
        if (closed) return;
        applySnapshot(result.snapshot);
        socket = new WebSocket(streamUrl(sessionId, sequence.current));
        socket.onopen = () => {
          reconnects.current = 0;
          setConnection("connected");
        };
        socket.onmessage = (message) =>
          consume(JSON.parse(String(message.data)) as StreamEnvelope);
        socket.onerror = () => socket?.close();
        socket.onclose = () => {
          if (closed) return;
          reconnects.current += 1;
          setConnection("reconnecting");
          if (reconnects.current >= 3) beginPolling();
          else
            reconnectTimer = window.setTimeout(
              connect,
              Math.min(4_000, 500 * 2 ** reconnects.current),
            );
        };
      } catch {
        if (!closed) beginPolling();
      }
    };
    void connect();
    return () => {
      closed = true;
      socket?.close();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (polling.current !== null) window.clearInterval(polling.current);
      polling.current = null;
    };
  }, [applySnapshot, record?.execution, sessionId]);

  const dispatch = useCallback(
    (event: SimulationEvent) => {
      if (record?.execution !== "api") {
        localDispatch(event);
        return;
      }
      if (
        [
          "SELECT_SERVICE",
          "SET_TOOL",
          "CORRELATE",
          "SET_SPEED",
          "SET_NOTES",
        ].includes(event.type)
      ) {
        localDispatch(event);
        return;
      }
      setActionError("");
      const key = idempotencyKey();
      let command: Promise<{ snapshot: ApiSnapshot }> | null = null;
      if (event.type === "START" || event.type === "RESUME")
        command = sessionCommand(sessionId, "resume", key);
      if (event.type === "PAUSE")
        command = sessionCommand(sessionId, "pause", key);
      if (event.type === "ADVANCE")
        command = sessionCommand(sessionId, "step", key);
      if (event.type === "PERFORM_ACTION")
        command = sendAction(sessionId, event.action, undefined, key);
      if (event.type === "UPDATE_ALERT")
        command = sendAction(sessionId, event.action, event.alertId, key);
      if (event.type === "COLLECT_EVIDENCE")
        command = sendEvidence(sessionId, event.evidence, key);
      if (event.type === "CREATE_HYPOTHESIS")
        command = sendHypothesis(sessionId, event.title, event.notes, key);
      if (event.type === "SET_HYPOTHESIS_STATUS")
        command = patchHypothesis(
          sessionId,
          event.hypothesisId,
          { status: event.status },
          key,
        );
      if (event.type === "ATTACH_EVIDENCE") {
        const hypothesis = state.hypotheses.find(
          (item) => item.id === event.hypothesisId,
        );
        command = patchHypothesis(
          sessionId,
          event.hypothesisId,
          {
            evidence_ids: [
              ...(hypothesis?.evidenceIds ?? []),
              event.evidenceId,
            ],
          },
          key,
        );
      }
      if (event.type === "SUBMIT_ROOT_CAUSE")
        command = submitRootCause(sessionId, event.submission, key);
      if (event.type === "VERIFY_RECOVERY")
        command = verifyRecovery(
          sessionId,
          event.evidenceIds,
          event.observation,
          key,
        );
      if (event.type === "COMPLETE_INCIDENT")
        command = completeIncident(sessionId, event.documentation, key);
      if (event.type === "RESET" || event.type === "ANNOTATE_EVIDENCE") {
        setActionError(
          "This control is unavailable for an authoritative session in Phase 5.",
        );
        return;
      }
      if (!command) return;
      void command
        .then(({ snapshot }) => applySnapshot(snapshot))
        .catch((error: unknown) =>
          setActionError(
            error instanceof Error
              ? error.message
              : "The simulated action failed. Refresh the snapshot and retry.",
          ),
        );
    },
    [
      applySnapshot,
      localDispatch,
      record?.execution,
      sessionId,
      state.hypotheses,
    ],
  );

  return {
    state,
    dispatch,
    connection,
    lastSynchronized,
    actionError,
  };
}
