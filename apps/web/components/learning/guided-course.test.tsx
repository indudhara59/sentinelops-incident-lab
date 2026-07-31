import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { GuidedCourse } from "./guided-course";
import { LOCAL_PROGRESS_KEY } from "@/lib/learning/progress";

describe("guided learning course", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses bounded local progress for guests and resumes", async () => {
    localStorage.setItem(
      LOCAL_PROGRESS_KEY,
      JSON.stringify({
        completedStepIds: ["system"],
        currentStepId: "alert",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<GuidedCourse />);
    expect(
      await screen.findByRole("heading", { name: "Read the first alert" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Guest progress saved/)).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Course completion" }),
    ).toHaveAttribute("aria-valuenow", "10");
  });

  it("explains answers and saves correct progress", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<GuidedCourse />);
    await screen.findByText(/Guest progress saved/);
    await user.click(
      screen.getByLabelText("The checkout path and expected behavior"),
    );
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText(/Correct — step complete/)).toBeInTheDocument();
    expect(screen.getByText(/anchoring bias/)).toBeInTheDocument();
    expect(localStorage.getItem(LOCAL_PROGRESS_KEY)).toContain('"system"');
  });

  it("persists authenticated progress and can reset with confirmation", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          completedStepIds: ["system"],
          currentStepId: "alert",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      })
      .mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<GuidedCourse />);
    expect(
      await screen.findByText(/saved to your account/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reset progress/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/learning-progress");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "PUT" });
  });

  it("provides accessible navigation and a preconfigured lab deep link", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<GuidedCourse />);
    await screen.findByText(/Guest progress saved/);
    expect(
      screen.getByRole("navigation", { name: "Course steps" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Inspect service-level metrics/ }),
    );
    expect(
      screen.getByRole("link", { name: "Launch metrics investigation lab" }),
    ).toHaveAttribute(
      "href",
      "/scenarios/midnight-latency-incident/briefing?learningStep=metrics",
    );
  });
});
