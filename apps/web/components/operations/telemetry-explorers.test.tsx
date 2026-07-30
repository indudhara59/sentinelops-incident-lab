import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { advanceSimulation, createInitialState } from "@/lib/simulation/engine";
import type { SimulationState } from "@/lib/simulation/types";
import {
  AlertCenter,
  DeploymentExplorer,
  LogExplorer,
  MetricsExplorer,
  TraceExplorer,
} from "./telemetry-explorers";

function stateAt(steps = 6): SimulationState {
  let state = createInitialState(
    "scenario",
    "sim_0123456789abcdef0123456789abcdef",
  );
  for (let index = 0; index < steps; index += 1)
    state = advanceSimulation(state);
  return state;
}

describe("telemetry explorers", () => {
  it("searches and filters logs, expands a row, and collects log evidence", async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<LogExplorer state={stateAt()} dispatch={dispatch} />);
    await user.type(
      screen.getByPlaceholderText("message, trace, request…"),
      "acquisition timed out",
    );
    expect(
      screen.getAllByText("database connection acquisition timed out").length,
    ).toBeGreaterThan(0);
    await user.selectOptions(screen.getByLabelText("Severity"), "ERROR");
    await user.click(screen.getAllByRole("button", { expanded: false })[0]!);
    expect(screen.getByText("trace_id")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Add log as evidence" }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "COLLECT_EVIDENCE",
        evidence: expect.objectContaining({ source: "Logs" }),
      }),
    );
  });

  it("shows synchronized metric charts and accessible table and collects a range", async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<MetricsExplorer state={stateAt()} dispatch={dispatch} />);
    const plot = screen.getByRole("img", { name: /Simulated Latency p95/i });
    const point = within(plot).getAllByRole("button")[0]!;
    fireEvent.mouseEnter(point);
    fireEvent.focus(point);
    expect(screen.getAllByText(/p95/i).length).toBeGreaterThan(0);
    await user.click(
      screen.getByRole("button", { name: "Accessible data table" }),
    );
    expect(
      screen.getByRole("table", { name: /Simulated metric samples/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Add visible range as evidence" }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "COLLECT_EVIDENCE",
        evidence: expect.objectContaining({ source: "Metrics" }),
      }),
    );
  });

  it("renders trace hierarchy, critical path, table alternative, and span evidence", async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<TraceExplorer state={stateAt()} dispatch={dispatch} />);
    expect(screen.getByText(/Critical path:/)).toHaveTextContent(
      "db.connection.acquire",
    );
    await user.click(screen.getAllByText("Span attributes")[0]!);
    await user.click(
      screen.getAllByRole("button", { name: "Add span as evidence" })[0]!,
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        evidence: expect.objectContaining({ source: "Traces" }),
      }),
    );
    await user.click(screen.getByRole("button", { name: "Accessible table" }));
    expect(
      screen.getByRole("table", { name: /Span hierarchy/i }),
    ).toBeInTheDocument();
  });

  it("acknowledges alerts and collects alert evidence", async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<AlertCenter state={stateAt()} dispatch={dispatch} />);
    await user.click(
      screen.getAllByRole("button", { name: "Acknowledge" })[0]!,
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "UPDATE_ALERT", action: "ack-alert" }),
    );
    await user.click(
      screen.getAllByRole("button", { name: "Add alert as evidence" })[0]!,
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        evidence: expect.objectContaining({ source: "Alerts" }),
      }),
    );
  });

  it("shows deployment markers, safe fictional references, and deployment evidence", async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<DeploymentExplorer state={stateAt()} dispatch={dispatch} />);
    expect(screen.getByText("sim-a82f6c1")).toBeInTheDocument();
    expect(screen.getAllByText("Deployment diff summary")).toHaveLength(2);
    await user.click(
      screen.getAllByRole("button", { name: "Add deployment as evidence" })[0]!,
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        evidence: expect.objectContaining({ source: "Deployments" }),
      }),
    );
  });
});
