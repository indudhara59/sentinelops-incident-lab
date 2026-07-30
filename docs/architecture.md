# Phase 5 architecture

The repository separates the public experience, API boundary, and shared contracts so later simulation capabilities can evolve without coupling UI rendering to backend internals.

```text
Browser -> Next.js (apps/web) -> FastAPI (services/api)
                  |                       |
                  +---- shared types -----+
                        packages/shared
```

FastAPI is authoritative for the scenario seed, simulation clock, lifecycle state, telemetry, alerts, actions, evidence, and hypotheses. Its allowlisted registry constructs one known engine; request content cannot select Python classes, modules, source code, or commands. Each in-memory session has a lock, bounded event history, TTL, subscriber queues, and one cancellable runner.

The browser is a responsive projection. It keeps view-only selection and correlation state, applies authoritative snapshots, ignores duplicate sequences, and resynchronizes after gaps or reconnects. WebSocket messages batch state and telemetry. Controlled snapshot polling is the transport fallback; telemetry is never fetched item by item. A local reducer remains only as a labelled educational fallback.

The service is intentionally single-process and ephemeral. There is no database, authentication, durable history, team synchronization, scoring system, or real-infrastructure integration.

## Security boundaries

- CORS origins must be explicitly configured.
- Every API response receives an `X-Request-ID`; valid client-supplied IDs are preserved.
- Exceptions produce stable JSON envelopes without production tracebacks.
- Operational examples are fictional and local-only.
