import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  owner: vi.fn(),
  get: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/lib/auth/owner", () => ({
  authenticatedOwnerId: mocks.owner,
}));
vi.mock("@/lib/learning/repository", () => ({
  getOwnedLearningProgress: mocks.get,
  saveOwnedLearningProgress: mocks.save,
}));

import { GET, PUT } from "./route";

describe("learning progress API ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses guest fallback semantics when unauthenticated", async () => {
    mocks.owner.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("passes only the authenticated owner to reads and writes", async () => {
    mocks.owner.mockResolvedValue("owner_alpha");
    mocks.get.mockResolvedValue({ completedStepIds: [] });
    mocks.save.mockResolvedValue({ completedStepIds: ["system"] });
    expect((await GET()).status).toBe(200);
    expect(mocks.get).toHaveBeenCalledWith("owner_alpha");
    const request = new Request("http://localhost/api/learning-progress", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        completedStepIds: ["system"],
        currentStepId: "system",
      }),
    });
    expect((await PUT(request)).status).toBe(200);
    expect(mocks.save).toHaveBeenCalledWith(
      "owner_alpha",
      expect.objectContaining({ completedStepIds: ["system"] }),
    );
  });
});
