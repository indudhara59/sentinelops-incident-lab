import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/simulation/engine";
import { CompletionPanel } from "./completion-panel";

const sessionId = "sim_0123456789abcdef0123456789abcdef";

describe("incident completion workspace", () => {
  it("requires linked evidence before enabling a root-cause submission", () => {
    const state = createInitialState(
      "scenario-midnight-latency-001",
      sessionId,
    );
    render(<CompletionPanel state={state} dispatch={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Submit evidence-linked conclusion" }),
    ).toBeDisabled();
    expect(
      screen.getAllByText(
        "Collect telemetry evidence before submitting a conclusion.",
      ),
    ).toHaveLength(2);
  });

  it("does not render the hidden root cause before completion", () => {
    const state = createInitialState(
      "scenario-midnight-latency-001",
      sessionId,
    );
    render(<CompletionPanel state={state} dispatch={vi.fn()} />);
    const text = document.body.textContent?.toLowerCase() ?? "";
    expect(text).not.toContain("failed to release database connections");
    expect(text).not.toContain("root-cause identification");
    fireEvent.change(screen.getByLabelText(/confidence/i), {
      target: { value: "70" },
    });
    expect(screen.getByText("Confidence: 70%")).toBeInTheDocument();
  });
});
