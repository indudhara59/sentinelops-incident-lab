import { act, renderHook } from "@testing-library/react";
import { useSimulation } from "./use-simulation";

describe("simulation timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("uses one timer, pauses cleanly, changes speed, and cancels after unmount", () => {
    const clear = vi.spyOn(window, "clearInterval");
    const { result, unmount } = renderHook(() =>
      useSimulation("scenario", "sim_0123456789abcdef0123456789abcdef"),
    );
    act(() => result.current.dispatch({ type: "START" }));
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.state.elapsedSeconds).toBe(30);
    act(() => result.current.dispatch({ type: "PAUSE" }));
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.dispatch({ type: "RESUME" }));
    act(() => result.current.dispatch({ type: "SET_SPEED", speed: 4 }));
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(250));
    expect(result.current.state.elapsedSeconds).toBe(60);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(clear).toHaveBeenCalled();
  });
});
