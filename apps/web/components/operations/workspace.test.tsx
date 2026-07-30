import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { saveLocalSession } from "@/lib/local-session";
import { OperationsWorkspace } from "./workspace";

const sessionId = "sim_0123456789abcdef0123456789abcdef";
describe("operations workspace", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it("rejects a valid-looking ID without a tab-local session", () => {
    render(
      <OperationsWorkspace
        sessionId={sessionId}
        scenarioSlug="midnight-latency-incident"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Local session unavailable" }),
    ).toBeInTheDocument();
  });
  it("selects a service and opens filtered telemetry", async () => {
    saveLocalSession(sessionId, "midnight-latency-incident");
    const user = userEvent.setup();
    render(
      <OperationsWorkspace
        sessionId={sessionId}
        scenarioSlug="midnight-latency-incident"
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Order service, healthy/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Order service" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Open filtered metrics/i }),
    );
    expect(screen.getByRole("tab", { name: "Metrics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("confirms impactful actions and records their timeline effect", async () => {
    saveLocalSession(sessionId, "midnight-latency-incident");
    const user = userEvent.setup();
    render(
      <OperationsWorkspace
        sessionId={sessionId}
        scenarioSlug="midnight-latency-incident"
      />,
    );
    await user.click(screen.getByRole("tab", { name: "Actions" }));
    await user.click(
      screen.getAllByRole("button", { name: "Review action" })[2]!,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Apply simulated action" }),
    );
    expect(
      screen.getByText(
        "Rollback initiated; the simulation enters mitigation and recovery can begin.",
      ),
    ).toBeInTheDocument();
  });
  it("supports single step, reset confirmation, and reduced-motion preference", async () => {
    saveLocalSession(sessionId, "midnight-latency-incident");
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    render(
      <OperationsWorkspace
        sessionId={sessionId}
        scenarioSlug="midnight-latency-incident"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Advance interval" }));
    expect(
      screen.getByText("Deployment completed", {
        selector: ".workspace-controls strong",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset simulation" }));
    expect(
      screen.getByText("Normal", { selector: ".workspace-controls strong" }),
    ).toBeInTheDocument();
  });
});
