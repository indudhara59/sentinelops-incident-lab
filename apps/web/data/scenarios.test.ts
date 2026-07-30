import { getScenarioBySlug, scenarios } from "./scenarios";

it("uses unique stable IDs and slugs", () => {
  expect(new Set(scenarios.map(({ id }) => id)).size).toBe(scenarios.length);
  expect(new Set(scenarios.map(({ slug }) => slug)).size).toBe(
    scenarios.length,
  );
});

it("handles an unknown scenario without substituting content", () => {
  expect(getScenarioBySlug("unknown-incident")).toBeUndefined();
});

it("marks at least one scenario ready and keeps solution fields out of public data", () => {
  expect(
    scenarios.some(
      ({ implementationStatus }) => implementationStatus === "ready",
    ),
  ).toBe(true);
  expect(JSON.stringify(scenarios).toLowerCase()).not.toContain(
    "rootcausesummary",
  );
  expect(JSON.stringify(scenarios).toLowerCase()).not.toContain(
    "validcorrectiveactions",
  );
});
