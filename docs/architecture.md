# Phase 2 architecture

The repository separates the public experience, API boundary, and shared contracts so later simulation capabilities can evolve without coupling UI rendering to backend internals.

```text
Browser -> Next.js (apps/web) -> FastAPI (services/api)
                  |                       |
                  +---- shared types -----+
                        packages/shared
```

Phase 2 remains intentionally stateless. There is no database, authentication, telemetry engine, WebSocket transport, scoring system, or real-infrastructure integration. FastAPI still exposes only service metadata and health/status probes.

Scenario definitions are divided at a code boundary: `data/scenarios.ts` is browser-safe briefing data, while `data/scenario-secrets.ts` is marked `server-only` and contains facilitator material. Catalog filtering runs locally against only the safe definitions. A start action creates a temporary `sessionStorage` record and navigates to a non-operational Phase 3 placeholder.

## Security boundaries

- CORS origins must be explicitly configured.
- Every API response receives an `X-Request-ID`; valid client-supplied IDs are preserved.
- Exceptions produce stable JSON envelopes without production tracebacks.
- Operational examples are fictional and local-only.
