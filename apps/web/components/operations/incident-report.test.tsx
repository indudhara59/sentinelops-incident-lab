import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveLocalSession } from "@/lib/local-session";
import type { IncidentReport } from "@/lib/simulation/api-client";
import { IncidentReportPage } from "./incident-report";

const sessionId = "sim_0123456789abcdef0123456789abcdef";
const fetchReport = vi.fn();
vi.mock("@/lib/simulation/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/simulation/api-client")>()),
  fetchReport: (...args: unknown[]) => fetchReport(...args),
  reportUrl: (_id: string, format: string) => `http://api/${format}`,
}));

const report: IncidentReport = {
  schemaVersion: "sentinelops-report@1.0.0",
  sessionId,
  scenario: {
    id: "scenario-midnight-latency-001",
    slug: "midnight-latency-incident",
    title: "The Midnight Latency Incident",
    version: "midnight-latency@1.0.0",
  },
  engineVersion: "sentinelops-engine@1.0.0",
  seed: 22,
  executiveSummary: "Checkout degradation followed a simulated deployment.",
  customerImpact: "Customers experienced failed checkout attempts.",
  timeline: [
    { id: "t1", second: 150, title: "Mitigation", description: "Rollback" },
  ],
  alerts: [{ id: "a1", title: "Latency alert" }],
  evidence: [{ id: "e1", source: "Metrics", summary: "Pool normalized" }],
  hypotheses: [{ id: "h1", title: "Connection lifecycle" }],
  rootCause: "Completed report root cause.",
  contributingFactors: ["Pool saturation"],
  actions: [{ id: "x1", label: "Rollback", second: 150 }],
  recoveryVerification: {
    verified: true,
    checks: { reducedLatency: true, stableObservationWindow: true },
  },
  score: {
    total: 88,
    maximum: 100,
    breakdown: [
      {
        category: "Evidence quality",
        score: 9,
        maximum: 10,
        explanation: "Diverse linked evidence.",
      },
    ],
  },
  missedEvidence: [],
  betterInvestigationPath: ["Confirm impact"],
  lessonsLearned: ["Test connection lifecycle"],
  followUpActions: ["Add pool alerts"],
  replay: {
    scenarioVersion: "midnight-latency@1.0.0",
    engineVersion: "sentinelops-engine@1.0.0",
    seed: 22,
    actions: [{ action: "rollback", second: 150 }],
  },
  disclaimer:
    "Educational simulated incident report. Not an official SRE certification or employment assessment.",
};

describe("post-incident report", () => {
  beforeEach(() => {
    sessionStorage.clear();
    saveLocalSession(
      sessionId,
      "midnight-latency-incident",
      sessionStorage,
      "api",
    );
    fetchReport.mockResolvedValue(report);
  });

  it("renders every report area and safe export actions", async () => {
    render(<IncidentReportPage sessionId={sessionId} />);
    expect(
      await screen.findByRole("heading", {
        name: "The Midnight Latency Incident",
      }),
    ).toBeInTheDocument();
    for (const heading of [
      "Executive summary",
      "Customer impact",
      "Incident timeline",
      "Alerts",
      "Evidence collected",
      "Hypotheses considered",
      "Root cause",
      "Contributing factors",
      "Actions taken",
      "Recovery verification",
      "Score breakdown",
      "Missed evidence",
      "Better investigation path",
      "Lessons learned",
      "Follow-up actions",
    ])
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /JSON report/i })).toHaveAttribute(
      "href",
      "http://api/report.json",
    );
    expect(screen.getByRole("link", { name: /CSV timeline/i })).toHaveAttribute(
      "href",
      "http://api/timeline.csv",
    );
  });

  it("supports print and local replay", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<IncidentReportPage sessionId={sessionId} />);
    await screen.findByText("88");
    fireEvent.click(screen.getByRole("button", { name: "Print report" }));
    expect(print).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Replay locally" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /Exact replay reconstructed/,
      ),
    );
    print.mockRestore();
  });
});
