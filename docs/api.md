# Phase 5 API

FastAPI serves the authoritative ephemeral simulation under `/api/v1`. Development Swagger UI is available at `/docs`; production disables interactive docs. Backend tests generate and validate the OpenAPI schema and required routes.

## Resources

- `GET /scenarios` and `GET /scenarios/{slug}` expose the safe allowlisted registry.
- `POST /sessions`, `GET /sessions/{id}`, `GET /sessions/{id}/snapshot`, and `DELETE /sessions/{id}` manage an ephemeral session.
- `POST /sessions/{id}/pause`, `/resume`, and `/step` perform validated lifecycle transitions.
- `POST /sessions/{id}/actions` accepts only fixed safe action identifiers.
- `POST /sessions/{id}/evidence`, `POST /sessions/{id}/hypotheses`, and `PATCH /sessions/{id}/hypotheses/{hypothesisId}` update bounded investigation state.
- `WS /sessions/{id}/stream?after={sequence}` delivers a snapshot and subsequent batches.

State-changing requests accept an `Idempotency-Key` of at most 128 characters. Clients should generate a new key per user intent and reuse it only when retrying that intent. Errors use `{error: {code, message, details, request_id}}`; `X-Request-ID` is echoed when valid.

The API has no authentication in this phase and must not be exposed as a multi-user production service.
