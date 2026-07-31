import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("public discovery metadata", () => {
  it("includes every learning route in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("http://localhost:3000/learn");
    expect(urls).toContain("http://localhost:3000/learn/opentelemetry");
    expect(urls).toContain("http://localhost:3000/learn/glossary");
  });

  it("allows public learning content and blocks private workspaces", () => {
    const policy = robots();
    expect(policy.rules).toMatchObject({
      allow: expect.arrayContaining(["/learn/"]),
      disallow: expect.arrayContaining(["/operations/", "/dashboard/"]),
    });
  });
});
