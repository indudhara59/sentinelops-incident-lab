# Phase 1 architecture

The repository separates the public experience, API boundary, and shared contracts so later simulation capabilities can evolve without coupling UI rendering to backend internals.

```text
Browser -> Next.js (apps/web) -> FastAPI (services/api)
                  |                       |
                  +---- shared types -----+
                        packages/shared
```

Phase 1 is intentionally stateless. There is no database, authentication, telemetry engine, WebSocket transport, scoring system, or real-infrastructure integration. FastAPI exposes only service metadata and health/status probes. The browser homepage uses deterministic, local demonstration data.

## Security boundaries

- CORS origins must be explicitly configured.
- Every API response receives an `X-Request-ID`; valid client-supplied IDs are preserved.
- Exceptions produce stable JSON envelopes without production tracebacks.
- Operational examples are fictional and local-only.
