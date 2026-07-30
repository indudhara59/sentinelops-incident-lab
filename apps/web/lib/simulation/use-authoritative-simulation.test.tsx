import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalSessionRecord } from "@/lib/local-session";
import { createInitialState } from "./engine";
import { useAuthoritativeSimulation } from "./use-authoritative-simulation";

const sessionId = "sim_0123456789abcdef0123456789abcdef";
const apiRecord: LocalSessionRecord = {
  scenarioSlug: "midnight-latency-incident",
  createdAt: "2026-01-01T00:00:00Z",
  phase: 5,
  execution: "api",
};
const localRecord: LocalSessionRecord = {
  ...apiRecord,
  execution: "local-fallback",
};

const fetchSnapshot = vi.fn();
const sessionCommand = vi.fn();
vi.mock("./api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api-client")>()),
  fetchSnapshot: (...args: unknown[]) => fetchSnapshot(...args),
  sessionCommand: (...args: unknown[]) => sessionCommand(...args),
  streamUrl: () => "ws://test/stream",
}));

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  constructor() {
    FakeWebSocket.instances.push(this);
  }
  close() {}
  open() {
    this.onopen?.();
  }
  message(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

function snapshot(tick: number, sequence = tick) {
  return {
    ...createInitialState("scenario-midnight-latency-001", sessionId),
    sessionId,
    version: tick,
    sequence,
    tick,
    elapsedSeconds: tick * 30,
    expiresAt: "2026-01-01T01:00:00Z",
  };
}

describe("authoritative simulation transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    fetchSnapshot.mockResolvedValue({
      snapshot: snapshot(2),
      events: [],
      latestSequence: 2,
    });
  });

  it("connects, resynchronizes snapshots, and ignores duplicate events", async () => {
    const { result } = renderHook(() =>
      useAuthoritativeSimulation(
        "scenario-midnight-latency-001",
        sessionId,
        apiRecord,
      ),
    );
    await waitFor(() => expect(result.current.state.tick).toBe(2));
    act(() => FakeWebSocket.instances[0]!.open());
    expect(result.current.connection).toBe("connected");
    act(() => {
      FakeWebSocket.instances[0]!.message({
        sequence: 3,
        type: "state.updated",
        session_id: sessionId,
        payload: { snapshot: snapshot(3, 3) },
      });
    });
    expect(result.current.state.tick).toBe(3);
    act(() => {
      FakeWebSocket.instances[0]!.message({
        sequence: 3,
        type: "state.updated",
        session_id: sessionId,
        payload: { snapshot: snapshot(1, 3) },
      });
    });
    expect(result.current.state.tick).toBe(3);
    expect(result.current.lastSynchronized).not.toBeNull();
  });

  it("shows reconnecting state and preserves the last workspace snapshot", async () => {
    const { result } = renderHook(() =>
      useAuthoritativeSimulation(
        "scenario-midnight-latency-001",
        sessionId,
        apiRecord,
      ),
    );
    await waitFor(() => expect(result.current.state.tick).toBe(2));
    act(() => FakeWebSocket.instances[0]!.onclose?.());
    expect(result.current.connection).toBe("reconnecting");
    expect(result.current.state.tick).toBe(2);
  });

  it("reports a failed authoritative action without optimistic mutation", async () => {
    sessionCommand.mockRejectedValue(new Error("Transition rejected"));
    const { result } = renderHook(() =>
      useAuthoritativeSimulation(
        "scenario-midnight-latency-001",
        sessionId,
        apiRecord,
      ),
    );
    await waitFor(() => expect(result.current.state.tick).toBe(2));
    act(() => result.current.dispatch({ type: "PAUSE" }));
    await waitFor(() =>
      expect(result.current.actionError).toBe("Transition rejected"),
    );
    expect(result.current.state.status).toBe("ready");
  });

  it("keeps the explicit local fallback operational", () => {
    const { result } = renderHook(() =>
      useAuthoritativeSimulation(
        "scenario-midnight-latency-001",
        sessionId,
        localRecord,
      ),
    );
    expect(result.current.connection).toBe("local-fallback");
    act(() => result.current.dispatch({ type: "ADVANCE" }));
    expect(result.current.state.tick).toBe(1);
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });
});
