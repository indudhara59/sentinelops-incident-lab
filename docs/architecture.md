# Phase 7 architecture

The repository separates the public experience, API boundary, and shared contracts so later simulation capabilities can evolve without coupling UI rendering to backend internals.

```text
Browser -> Next.js (apps/web) -> FastAPI (services/api)
             |                            |
             +-> Auth.js -> MongoDB Atlas |
             +-------- shared types ------+
                       packages/shared
```

FastAPI is authoritative for the scenario seed, simulation clock, lifecycle state, telemetry, alerts, actions, evidence, and hypotheses. Its allowlisted registry constructs one known engine; request content cannot select Python classes, modules, source code, or commands. Each in-memory session has a lock, bounded event history, TTL, subscriber queues, and one cancellable runner.

The browser is a responsive projection. It keeps view-only selection and correlation state, applies authoritative snapshots, ignores duplicate sequences, and resynchronizes after gaps or reconnects. WebSocket messages batch state and telemetry. Controlled snapshot polling is the transport fallback; telemetry is never fetched item by item. A local reducer remains only as a labelled educational fallback.

The simulation service is intentionally single-process and ephemeral. The Next.js server adds an independent authenticated persistence boundary for bounded snapshots and reports; it does not make Atlas part of simulation timing or state transitions. There is no team synchronization or real-infrastructure integration.

Phase 6 adds a backend-only truth model beside each allowlisted engine. Snapshots never serialize it. Once evidence, conclusion, mitigation, stable recovery, and documentation gates pass, a pure report generator compares the recorded submission with that truth and stores the resulting report in the same ephemeral session. No external AI service participates.

Phase 7 uses Auth.js database sessions to establish an immutable user ID. Same-origin route handlers copy that ID into owner-scoped MongoDB repositories; browser input can never choose the owner. Atlas receives only bounded summary telemetry and meaningful investigation artifacts. An Atlas outage does not stop the FastAPI simulation.

## Security boundaries

- CORS origins must be explicitly configured.
- Every API response receives an `X-Request-ID`; valid client-supplied IDs are preserved.
- Exceptions produce stable JSON envelopes without production tracebacks.
- Operational examples are fictional and local-only.
