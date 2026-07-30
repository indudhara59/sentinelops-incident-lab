# CORS configuration

Set `SENTINELOPS_CORS_ORIGINS` to a JSON list of exact browser origins, for example:

```env
SENTINELOPS_CORS_ORIGINS=["http://localhost:3000"]
```

Wildcards and non-HTTP(S) origins are rejected. Allowed methods are GET, POST, PATCH, DELETE, and OPTIONS. Allowed request headers are `Accept`, `Content-Type`, `X-Request-ID`, and `Idempotency-Key`; `X-Request-ID` is exposed. WebSocket origin enforcement should be provided by the trusted reverse proxy before any non-development deployment because Phase 5 intentionally has no authentication.
