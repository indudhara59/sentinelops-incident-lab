import { describe, expect, it } from "vitest";
import { COURSE_STEPS, LEARNING_SLUGS, getLearningTopic } from "./content";
import { COURSE_VERSION, sanitizeProgress } from "./progress";

describe("learning content and progress", () => {
  it("registers every requested route with unique content", () => {
    expect(new Set(LEARNING_SLUGS).size).toBe(12);
    for (const slug of LEARNING_SLUGS)
      expect(getLearningTopic(slug)).toBeDefined();
    expect(COURSE_STEPS).toHaveLength(10);
  });

  it("bounds progress to known steps and current course version", () => {
    const ids = COURSE_STEPS.map((step) => step.id);
    const progress = sanitizeProgress(
      {
        completedStepIds: ["system", "system", "forged"],
        currentStepId: "forged",
        courseVersion: "old",
      },
      ids,
    );
    expect(progress.courseVersion).toBe(COURSE_VERSION);
    expect(progress.completedStepIds).toEqual(["system"]);
    expect(progress.currentStepId).toBe("alert");
  });
});
