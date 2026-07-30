import { describe, expect, it } from "vitest";
import { authenticationConfigured, safeRedirectTarget } from "./config";

describe("authentication configuration", () => {
  it("rejects external and protocol-relative redirects", () => {
    expect(safeRedirectTarget("https://evil.invalid/steal")).toBe("/dashboard");
    expect(safeRedirectTarget("//evil.invalid/steal")).toBe("/dashboard");
    expect(safeRedirectTarget("/dashboard/incidents?page=2")).toBe(
      "/dashboard/incidents?page=2",
    );
  });

  it("reports authentication unavailable unless every dependency is configured", () => {
    expect(authenticationConfigured({})).toBe(false);
    expect(
      authenticationConfigured({
        AUTH_SECRET: "secret",
        AUTH_GOOGLE_ID: "id",
        AUTH_GOOGLE_SECRET: "secret",
        MONGODB_URI: "mongodb+srv://example.invalid",
        MONGODB_DB_NAME: "sentinelops",
      }),
    ).toBe(true);
  });
});
