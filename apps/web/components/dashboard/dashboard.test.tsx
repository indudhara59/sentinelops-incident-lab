import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseUnavailable } from "./database-state";
import { DeleteIncidentButton } from "./delete-incident-button";
import { ResumeIncidentLink } from "./resume-incident-link";
import { SettingsForm } from "./settings-form";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));

describe("dashboard account controls", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders a redacted database unavailable state", () => {
    render(<DatabaseUnavailable />);
    expect(
      screen.getByRole("heading", { name: /Atlas connection unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/mongodb\+srv/i)).not.toBeInTheDocument();
  });

  it("requires confirmation before owner-scoped deletion", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    render(<DeleteIncidentButton id={`sim_${"a".repeat(32)}`} />);
    await user.click(
      screen.getByRole("button", { name: "Delete investigation" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/incidents/"),
      expect.objectContaining({
        method: "DELETE",
        headers: { "x-confirm-delete": "delete" },
      }),
    );
  });

  it("restores the tab-local API reference before resume navigation", async () => {
    const user = userEvent.setup();
    const id = `sim_${"b".repeat(32)}`;
    render(<ResumeIncidentLink id={id} />);
    await user.click(
      screen.getByRole("button", { name: "Resume investigation" }),
    );
    expect(sessionStorage.getItem(`sentinelops:${id}`)).toContain(
      '"execution":"api"',
    );
  });

  it("saves bounded account preferences through the authenticated endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ok: true }));
    render(
      <SettingsForm
        initial={{
          displayName: "Responder",
          theme: "system",
          reducedMotion: false,
          defaultSimulationSpeed: 1,
          telemetryDensity: "comfortable",
        }}
      />,
    );
    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Ada Responder");
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(await screen.findByText("Settings saved.")).toBeInTheDocument();
  });
});
