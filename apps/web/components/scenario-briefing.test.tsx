import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { getScenarioBySlug } from "@/data/scenarios";
import { ScenarioBriefing } from "./scenario-briefing";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("scenario briefing", () => {
  beforeEach(() => {
    push.mockClear();
    sessionStorage.clear();
  });

  it("renders player-visible incident context and checklist", () => {
    const scenario = getScenarioBySlug("midnight-latency-incident");
    expect(scenario).toBeDefined();
    render(<ScenarioBriefing scenario={scenario!} />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The Midnight Latency Incident",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Northstar Market · Kubernetes e-commerce application"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Incident commander checklist" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Verify recovery")).toBeInTheDocument();
  });

  it("does not render root cause, correct action, hidden evidence, or scoring", () => {
    render(
      <ScenarioBriefing
        scenario={getScenarioBySlug("midnight-latency-incident")!}
      />,
    );
    const page = document.body.textContent?.toLowerCase() ?? "";
    expect(page).not.toContain("connection-pool leak");
    expect(page).not.toContain("roll back the affected deployment");
    expect(page).not.toContain("scoring weight");
    expect(page).not.toContain("omit release");
  });

  it("creates a local session and navigates to the Phase 3 placeholder", () => {
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(
      (array) => {
        (array as Uint8Array).fill(10);
        return array;
      },
    );
    render(
      <ScenarioBriefing
        scenario={getScenarioBySlug("midnight-latency-incident")!}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /start investigation/i }),
    );
    const expected = "sim_0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a";
    expect(push).toHaveBeenCalledWith(
      `/operations/${expected}?scenario=midnight-latency-incident`,
    );
    expect(sessionStorage.getItem(`sentinelops:${expected}`)).toContain(
      '"phase":2',
    );
    vi.restoreAllMocks();
  });

  it("does not claim planned scenarios can start", () => {
    render(
      <ScenarioBriefing
        scenario={getScenarioBySlug("authentication-storm")!}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /start investigation/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Simulation engine not available yet"),
    ).toBeInTheDocument();
  });
});
