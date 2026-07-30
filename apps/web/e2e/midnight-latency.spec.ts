import { expect, test } from "@playwright/test";

test("investigates a short API-backed midnight latency incident", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/scenarios/midnight-latency-incident");
  await page.getByRole("button", { name: /Start Investigation/i }).click();
  await expect(page).toHaveURL(
    /\/operations\/sim_[a-f0-9]{32}\?scenario=midnight-latency-incident/,
  );
  await expect(
    page.getByRole("heading", { name: "The Midnight Latency Incident" }),
  ).toBeVisible();
  await expect(page.getByText("API connected")).toBeVisible();
  await page.getByRole("button", { name: "Start simulation" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  for (let index = 0; index < 4; index += 1)
    await page.getByRole("button", { name: "Advance interval" }).click();
  await page.getByRole("button", { name: /Order service,/i }).click();
  await page.getByRole("button", { name: /Open filtered metrics/i }).click();
  await expect(
    page.getByRole("heading", { name: "Metrics dashboards" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add visible range as evidence" })
    .click();
  await page.getByRole("tab", { name: "Logs" }).click();
  await expect(
    page.getByRole("heading", { name: "Log explorer" }),
  ).toBeVisible();
  await page.locator(".structured-log > button").first().click();
  await page.getByRole("button", { name: "Add log as evidence" }).click();
  await page.getByRole("button", { name: "Open trace" }).click();
  await expect(
    page.getByRole("heading", { name: "Trace explorer" }),
  ).toBeVisible();
  await page.getByText("Span attributes").first().click();
  await page
    .getByRole("button", { name: "Add span as evidence" })
    .first()
    .click();
  await page.getByRole("tab", { name: "Evidence" }).click();
  await page
    .getByPlaceholder("What might explain the impact?")
    .fill("Database connection pressure");
  await page.getByRole("button", { name: "Create hypothesis" }).click();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("tab", { name: "Actions" }).click();
  await page
    .getByRole("heading", { name: "Roll back deployment" })
    .locator("..")
    .getByRole("button", { name: "Review action" })
    .click();
  await page.getByRole("button", { name: "Apply simulated action" }).click();
  await expect(
    page.locator(".action-history").getByText(/Rollback initiated/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  for (let index = 0; index < 4; index += 1)
    await page.getByRole("button", { name: "Advance interval" }).click();
  await page.getByRole("tab", { name: "Complete" }).click();
  await page.getByLabel("Affected service").selectOption("order-service");
  await page
    .getByLabel("Failure mechanism")
    .selectOption("database-connections-not-released");
  await page
    .getByLabel("Triggering change")
    .selectOption("order-service-2.14.7-deployment");
  await page
    .getByLabel("Proposed mitigation")
    .selectOption("rollback-order-service-2.14.7");
  const supporting = page
    .getByRole("group", { name: /Supporting evidence/i })
    .getByRole("checkbox");
  for (let index = 0; index < 3; index += 1)
    await supporting.nth(index).check();
  await page
    .getByLabel("Rejected alternatives, one per line")
    .fill("Traffic surge — request rate stayed stable");
  await page
    .getByRole("button", { name: "Submit evidence-linked conclusion" })
    .click();
  await expect(page.getByText(/Conclusion recorded/)).toBeVisible();
  const recovery = page
    .getByRole("group", { name: /Recovery evidence/i })
    .getByRole("checkbox");
  await recovery.nth(0).check();
  await recovery.nth(1).check();
  await page
    .getByLabel("Recovery observation")
    .fill(
      "Latency, error rate, pool usage, and successful traces stayed healthy for three intervals.",
    );
  await page.getByRole("button", { name: "Verify recovery signals" }).click();
  await expect(page.getByText("Stable recovery verified.")).toBeVisible();
  await page
    .getByLabel("Executive incident summary")
    .fill(
      "Checkout degraded after an order-service deployment and recovered following the simulated rollback.",
    );
  await page
    .getByLabel("Customer impact")
    .fill("Customers experienced slow and failed checkout attempts.");
  await page
    .getByLabel("Lessons learned, one per line")
    .fill("Monitor database connection wait time by deployment version.");
  await page
    .getByLabel("Follow-up actions, one per line")
    .fill(
      "Add regression coverage for database connection lifecycle handling.",
    );
  await page
    .getByRole("button", { name: "Complete incident and generate report" })
    .click();
  await page.getByRole("link", { name: /Open post-incident report/i }).click();
  await expect(page).toHaveURL(/\/operations\/sim_[a-f0-9]{32}\/report/);
  await expect(
    page.getByRole("heading", { name: "Score breakdown" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Root cause" })).toBeVisible();
});
