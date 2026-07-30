import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3107",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "../../services/api/.venv/bin/uvicorn app.main:app --app-dir ../../services/api --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: false,
      env: {
        SENTINELOPS_CORS_ORIGINS: '["http://127.0.0.1:3107"]',
        SENTINELOPS_ENVIRONMENT: "test",
      },
    },
    {
      command: "corepack pnpm exec next dev -p 3107",
      url: "http://127.0.0.1:3107",
      reuseExistingServer: false,
      env: { NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000" },
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
