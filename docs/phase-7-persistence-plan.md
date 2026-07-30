# Phase 7 persistence plan

Phase 7 adds an authenticated persistence boundary without changing the FastAPI
simulation engine's authority or deterministic behavior.

1. **Atlas connection and indexes** — add a single pooled MongoDB client in the
   Next.js server runtime, validate Atlas-only configuration, expose a redacted
   health result, and provide an explicit idempotent index setup command.
2. **Authentication boundary** — configure Auth.js with Google and database
   sessions, secure dashboard routes, validate callback URLs, and keep an
   explicitly opt-in development demo identity isolated from production.
3. **Owned repositories** — store bounded incident summaries, evidence,
   hypotheses, reports, saved scenarios, and preferences. Every read and write
   includes the authenticated immutable owner ID; IDs, sorts, pagination, and
   text sizes are allowlisted and bounded before reaching MongoDB.
4. **Persistence integration** — authenticated same-origin endpoints capture
   bounded session snapshots and completed reports while the existing FastAPI
   service continues to execute the incident. Database failures do not alter or
   stall the simulation.
5. **Dashboard and settings** — add protected overview, history, incident,
   report, and settings pages with search, filters, safe pagination, replay,
   resume, and confirmed deletion.
6. **Verification and operations** — test configuration, indexes, ownership,
   safe queries, bounds, unavailable states, and dashboard behavior; document
   Atlas networking, authentication, the data model, and operational security.

Phase 7 does not add multiplayer behavior, a scenario builder, or unbounded raw
telemetry storage.
