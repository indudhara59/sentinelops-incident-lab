# SentinelOps Incident Lab

SentinelOps Incident Lab is an independent educational project for learning incident response and observability through safe, fictional cloud scenarios. It never connects to, scans, modifies, or interferes with real infrastructure. It is not a penetration-testing platform.

## Phase 3

This repository provides the monorepo foundation, public Next.js site, production-conscious FastAPI service, scenario catalog and briefings, plus a client-side investigation workspace for **The Midnight Latency Incident**. Phase 3 adds deterministic telemetry, topology exploration, evidence collection, hypotheses, safe simulated actions, and replay controls.

The simulation is entirely local. WebSockets, backend telemetry execution, persistence, authentication, scoring, reports, team mode, and scenario creation are not implemented.

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

Run `pnpm verify`, or use the individual `lint:*`, `typecheck:*`, and `test:*` scripts. Run `pnpm --filter @sentinelops/web test:e2e` for the Chromium investigation flow. No secrets are required for Phase 3.

## Scenario authoring

Public scenario briefings live in `apps/web/data/scenarios.ts`. Facilitator-only solution material lives in the server-only `apps/web/data/scenario-secrets.ts` module and must never be imported by a Client Component. See [the scenario format](docs/scenario-format.md) before editing either file.

## Project status

This is an independent portfolio project and is not affiliated with or endorsed by any cloud, observability, or security vendor.
