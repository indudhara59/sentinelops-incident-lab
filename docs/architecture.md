# Phase 3 architecture

The repository separates the public experience, API boundary, and shared contracts so later simulation capabilities can evolve without coupling UI rendering to backend internals.

```text
Browser -> Next.js (apps/web) -> FastAPI (services/api)
                  |                       |
                  +---- shared types -----+
                        packages/shared
```

Phase 3 remains server-stateless. There is no database, authentication, WebSocket transport, scoring system, or real-infrastructure integration. FastAPI still exposes only service metadata and health/status probes. The simulation engine is a pure client-side reducer driven by a scenario ID, session seed, simulated time, and recorded player actions.

Scenario definitions remain divided at a code boundary. The ready Midnight Latency scenario now hands its temporary `sessionStorage` record to a validated workspace. Telemetry is derived in memory without event API requests. Logs and metrics are bounded, timers have one owner, and reset reconstructs the original seeded state.

## Security boundaries

- CORS origins must be explicitly configured.
- Every API response receives an `X-Request-ID`; valid client-supplied IDs are preserved.
- Exceptions produce stable JSON envelopes without production tracebacks.
- Operational examples are fictional and local-only.
