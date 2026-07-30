import { describe, expect, it } from "vitest";
import { reportInvestigationAreas } from "./reports";
import type { IncidentReportDocument } from "./model";

describe("dashboard report insights", () => {
  it("derives strongest and improvement areas from the latest score", () => {
    const report = {
      report: {
        score: {
          breakdown: [
            { category: "Evidence quality", score: 10, maximum: 10 },
            { category: "Recovery verification", score: 4, maximum: 10 },
          ],
        },
      },
    } as unknown as IncidentReportDocument;
    expect(reportInvestigationAreas(report)).toEqual({
      strongest: "Evidence quality",
      improvement: "Recovery verification",
    });
  });
});
