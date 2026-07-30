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
});
