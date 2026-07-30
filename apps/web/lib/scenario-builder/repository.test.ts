import { describe, expect, it } from "vitest";
import {
  isCustomScenarioId,
  nextScenarioVersion,
  ownedScenarioFilter,
} from "./repository";

describe("custom scenario ownership and versioning", () => {
  const id = `custom_${"a".repeat(32)}`;
  it("uses strict opaque IDs and immutable owner filters", () => {
    expect(isCustomScenarioId(id)).toBe(true);
    expect(isCustomScenarioId('{"$ne":null}')).toBe(false);
    expect(ownedScenarioFilter("owner-a", id)).toEqual({
      ownerId: "owner-a",
      scenarioId: id,
    });
    expect(ownedScenarioFilter("owner-b", id)).not.toEqual(
      ownedScenarioFilter("owner-a", id),
    );
  });
  it("creates a new version only after completed sessions", () => {
    expect(nextScenarioVersion(null, false)).toBe(1);
    expect(nextScenarioVersion(2, false)).toBe(2);
    expect(nextScenarioVersion(2, true)).toBe(3);
  });
});
