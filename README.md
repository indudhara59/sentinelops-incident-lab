# SentinelOps Incident Lab

SentinelOps Incident Lab is an independent educational project for learning incident response and observability through safe, fictional cloud scenarios. It never connects to, scans, modifies, or interferes with real infrastructure. It is not a penetration-testing platform.

## Phase 5

This repository provides the scenario catalog, briefings, and investigation workspace for **The Midnight Latency Incident**. Phase 5 moves authoritative, deterministic execution into FastAPI and delivers versioned telemetry batches and snapshots over WebSockets with bounded polling fallback.

Sessions are ephemeral server memory and all measurements are labelled simulated. The workspace can use an explicitly labelled local educational fallback when the development API is unavailable. MongoDB, authentication, persistent history, scoring, reports, team mode, and scenario creation are not implemented.

## Structure

- `apps/web` — Next.js App Router frontend
- `services/api` — FastAPI service
- `packages/shared` — framework-neutral shared schemas and constants
- `docs` — product and architecture notes

## Requirements

- Node.js 22+ and pnpm 10+
- Python 3.12+

## Local development

```bash
pnpm install
python3.12 -m venv services/api/.venv
source services/api/.venv/bin/activate
pip install -e 'services/api[dev]'
cp .env.example .env
pnpm dev:web
pnpm dev:api
```

The web app runs at `http://localhost:3000`; API documentation is available at `http://localhost:8000/docs` in development.

## Verification

Run `pnpm verify`, or use the individual `lint:*`, `typecheck:*`, and `test:*` scripts. Run `pnpm --filter @sentinelops/web test:e2e` for the API-backed Chromium investigation flow. No secrets are required for Phase 5.

FastAPI publishes interactive OpenAPI documentation at `http://localhost:8000/docs` outside production. Its generated schema is validated in the backend tests. See [API documentation](docs/api.md), [the real-time protocol](docs/realtime-protocol.md), and [operational limits](docs/operational-limits.md).

## Observability tools

The workspace includes bounded OpenTelemetry-shaped logs, simulated service metrics with accessible tables, hierarchical traces, local alert workflows, and fictional deployment history. Correlation links preserve relevant service, trace, deployment, and time-window context in the URL. See [the telemetry model](docs/telemetry-model.md) for contracts and limits.

## Scenario authoring

Public scenario briefings live in `apps/web/data/scenarios.ts`. Facilitator-only solution material lives in the server-only `apps/web/data/scenario-secrets.ts` module and must never be imported by a Client Component. See [the scenario format](docs/scenario-format.md) before editing either file.

## Project status

This is an independent portfolio project and is not affiliated with or endorsed by any cloud, observability, or security vendor.
