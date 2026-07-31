import { describe, expect, it } from "vitest";
import { learningProgressFilter } from "./repository";

describe("learning progress ownership", () => {
  it("always scopes progress by immutable owner and course version", () => {
    const first = learningProgressFilter("owner_alpha");
    const second = learningProgressFilter("owner_bravo");
    expect(first.ownerId).toBe("owner_alpha");
    expect(second.ownerId).toBe("owner_bravo");
    expect(first.courseVersion).toBe(second.courseVersion);
    expect(first).not.toEqual(second);
  });
});
