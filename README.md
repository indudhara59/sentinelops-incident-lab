# SentinelOps Incident Lab

SentinelOps Incident Lab is an independent educational project for learning incident response and observability through safe, fictional cloud scenarios. It never connects to, scans, modifies, or interferes with real infrastructure. It is not a penetration-testing platform.

## Phase 7

This repository provides the scenario catalog, briefings, investigation workspace, and evidence-based post-incident workflow for **The Midnight Latency Incident**. Phase 7 adds optional MongoDB Atlas persistence, Google authentication through Auth.js, protected investigation history, reports, and account preferences.

FastAPI remains the authoritative, ephemeral simulation engine and all measurements are labelled simulated. Signed-in users can save bounded summaries, evidence, hypotheses, actions, scores, and reports to Atlas. Raw telemetry is not persisted. When Atlas or authentication is unavailable, public simulations still work and the UI clearly states that progress cannot be saved. Team mode and scenario creation are not implemented.

## Structure

- `apps/web` — Next.js App Router frontend
- `services/api` — FastAPI service
- `packages/shared` — framework-neutral shared schemas and constants
- `docs` — product and architecture notes

## Requirements

- Node.js 22+ and pnpm 10+
- Python 3.12+
- An online MongoDB Atlas cluster and Google OAuth client for saved accounts

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

Set the Atlas and Auth.js placeholders in your uncommitted `.env`, then run `pnpm --filter @sentinelops/web db:indexes` once per database. The web app runs at `http://localhost:3000`; API documentation is available at `http://localhost:8000/docs` in development. Atlas is optional for public, unsaved simulation work and no local MongoDB is required or supported.

## Verification

Run `pnpm verify`, or use the individual `lint:*`, `typecheck:*`, and `test:*` scripts. Run `pnpm --filter @sentinelops/web test:e2e` for the API-backed Chromium investigation and report flow. Unit tests do not require Atlas and reject production-style database names in test mode. Never run destructive tests against a production database.

FastAPI publishes interactive OpenAPI documentation at `http://localhost:8000/docs` outside production. Its generated schema is validated in the backend tests. See [API documentation](docs/api.md), [the real-time protocol](docs/realtime-protocol.md), and [operational limits](docs/operational-limits.md).

## Completion and reports

The Complete tool requires a structured conclusion with at least three linked evidence items across two sources. Recovery is verified from latency, error rate, connection-pool usage, successful checkout traces, and a stable observation window. Reports are deterministic templates derived from recorded session state—not an official SRE certification or employment assessment. See [scoring](docs/scoring.md) and [reports](docs/reports.md).

## Accounts and persistence

Auth.js uses Google OAuth and server-side database sessions; SentinelOps does not store passwords. Every user-owned query includes the immutable Auth.js user ID. Saved data is bounded and incomplete temporary sessions expire after 30 days. Configure Atlas TLS, networking, and indexes using [the Atlas guide](docs/mongodb-atlas.md), then review [authentication](docs/authentication.md), [the data model](docs/data-model.md), and [security controls](docs/security.md).

## Observability tools

The workspace includes bounded OpenTelemetry-shaped logs, simulated service metrics with accessible tables, hierarchical traces, local alert workflows, and fictional deployment history. Correlation links preserve relevant service, trace, deployment, and time-window context in the URL. See [the telemetry model](docs/telemetry-model.md) for contracts and limits.

## Scenario authoring

Public scenario briefings live in `apps/web/data/scenarios.ts`. Facilitator-only solution material lives in the server-only `apps/web/data/scenario-secrets.ts` module and must never be imported by a Client Component. See [the scenario format](docs/scenario-format.md) before editing either file.

## Project status

This is an independent portfolio project and is not affiliated with or endorsed by any cloud, observability, or security vendor.
