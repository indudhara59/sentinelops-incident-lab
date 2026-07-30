import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("falls back locally when the API is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
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
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/operations/${expected}?scenario=midnight-latency-incident&fallback=local`,
      ),
    );
    expect(sessionStorage.getItem(`sentinelops:${expected}`)).toContain(
      '"phase":5',
    );
    vi.restoreAllMocks();
  });

  it("creates an authoritative API session when available", async () => {
    const sessionId = "sim_11111111111111111111111111111111";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: sessionId,
          scenario_slug: "midnight-latency-incident",
          seed: 1,
          version: 0,
          expires_at: "2026-01-01T01:00:00Z",
          snapshot: {},
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(
      <ScenarioBriefing
        scenario={getScenarioBySlug("midnight-latency-incident")!}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /start investigation/i }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/operations/${sessionId}?scenario=midnight-latency-incident`,
      ),
    );
    expect(sessionStorage.getItem(`sentinelops:${sessionId}`)).toContain(
      '"execution":"api"',
    );
    vi.restoreAllMocks();
  });

  it("allows a completed additional built-in scenario to start", () => {
    render(
      <ScenarioBriefing
        scenario={getScenarioBySlug("authentication-storm")!}
      />,
    );
    expect(
      screen.getByRole("button", { name: /start investigation/i }),
    ).toBeInTheDocument();
  });
});
