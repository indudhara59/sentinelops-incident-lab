# Phase 5 API

## Phase 8 application routes

Authenticated Next.js handlers expose owner-scoped `/api/custom-scenarios`, `/api/custom-scenarios/{id}`, and `/api/custom-scenarios/{id}/actions`. Actions are restricted to `validate`, `test-run`, `duplicate`, and `archive`; arbitrary names are rejected. These routes are separate from FastAPI's allowlisted built-in execution API and never register custom code.

FastAPI serves the authoritative ephemeral simulation under `/api/v1`. Development Swagger UI is available at `/docs`; production disables interactive docs. Backend tests generate and validate the OpenAPI schema and required routes.

## Resources

- `GET /scenarios` and `GET /scenarios/{slug}` expose the safe allowlisted registry.
- `POST /sessions`, `GET /sessions/{id}`, `GET /sessions/{id}/snapshot`, and `DELETE /sessions/{id}` manage an ephemeral session.
- `POST /sessions/{id}/pause`, `/resume`, and `/step` perform validated lifecycle transitions.
- `POST /sessions/{id}/actions` accepts only fixed safe action identifiers.
- `POST /sessions/{id}/evidence`, `POST /sessions/{id}/hypotheses`, and `PATCH /sessions/{id}/hypotheses/{hypothesisId}` update bounded investigation state.
- `WS /sessions/{id}/stream?after={sequence}` delivers a snapshot and subsequent batches.
- `POST /sessions/{id}/root-cause`, `/recovery/verify`, and `/complete` enforce the Phase 6 gates.
- `GET /sessions/{id}/report`, `/report.json`, and `/timeline.csv` expose a completed ephemeral report and safe exports.

State-changing requests accept an `Idempotency-Key` of at most 128 characters. Clients should generate a new key per user intent and reuse it only when retrying that intent. Errors use `{error: {code, message, details, request_id}}`; `X-Request-ID` is echoed when valid.

The API has no authentication in this phase and must not be exposed as a multi-user production service.

# Learning progress

`GET /api/learning-progress` and `PUT /api/learning-progress` are same-origin Auth.js-protected handlers for the bounded guided-course record. They return `401` for guests so the public client can use its documented local fallback. Reads and upserts always use the immutable owner ID and fixed course version; arbitrary course IDs and step IDs are not accepted.

# Runtime health and stream capability

`GET /health` is a liveness probe. `GET /ready` confirms the in-process session store is initialized and reports the active-session count for deployment diagnostics. `POST /api/v1/sessions` returns a stream capability once; later session reads and snapshots do not disclose it. WebSocket authentication and reconnect behavior are documented in the real-time protocol.
