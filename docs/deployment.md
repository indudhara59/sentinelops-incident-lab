# Deployment guide

No deployment is performed by repository configuration alone. The placeholders below must be replaced and each provider must report healthy before publishing a live-demo URL.

## Architecture

Deploy the Next.js application to Vercel, the stateful FastAPI/WebSocket service to one Render or Railway process, and durable account data to MongoDB Atlas. Do not move `/api/v1` simulation routes or the in-memory store into Vercel functions. Active simulation sessions require a long-lived process and sticky in-process state.

## 1. MongoDB Atlas

1. Create separate development/preview and production projects or databases.
2. Create a least-privilege database user and a strong generated password.
3. Configure network access for Vercel egress according to the chosen Vercel networking plan. Avoid `0.0.0.0/0` in production when a narrower option is available.
4. Use the `mongodb+srv://` TLS connection string as `MONGODB_URI`; set `MONGODB_DB_NAME` to a non-test production database.
5. From a trusted environment with production variables loaded, run `pnpm --filter @sentinelops/web db:indexes` once. The command creates indexes only; review its target database before running it.

## 2. FastAPI on Render

`render.yaml` builds `services/api/Dockerfile`, checks `/ready`, and intentionally runs one Uvicorn worker. Create a Blueprint from the repository and set:

```text
SENTINELOPS_ENVIRONMENT=production
SENTINELOPS_LOG_LEVEL=INFO
SENTINELOPS_CORS_ORIGINS=["https://YOUR-VERCEL-DOMAIN"]
SENTINELOPS_MAX_ACTIVE_SESSIONS=50
SENTINELOPS_SESSION_TTL_SECONDS=1800
SENTINELOPS_SESSION_RATE_LIMIT_PER_MINUTE=120
```

Confirm `GET /health`, `GET /ready`, HTTPS, and WSS. The production start command is:

```bash
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1 --proxy-headers --forwarded-allow-ips='*'
```

Only use trusted platform proxies with forwarded headers. A second worker or instance creates a separate in-memory session store and is unsupported.

## Railway alternative

Create a service with root directory `services/api`; Railway reads `railway.json` and `Dockerfile`. Configure the same `SENTINELOPS_*` variables and keep replicas/workers at one. Generate a stable public HTTPS domain and verify WSS upgrade support and `/ready` before configuring Vercel.

## 3. Next.js on Vercel

Import the repository with repository root as the project root; `vercel.json` installs the pnpm workspace and builds `@sentinelops/web`. Set:

```text
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-DOMAIN
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-OR-RAILWAY-DOMAIN
NEXT_PUBLIC_REPOSITORY_URL=https://github.com/OWNER/sentinelops-incident-lab
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=sentinelops_production
AUTH_SECRET=generated-secret
AUTH_GOOGLE_ID=google-client-id
AUTH_GOOGLE_SECRET=google-client-secret
AUTH_URL=https://YOUR-VERCEL-DOMAIN
AUTH_TRUST_HOST=true
```

Add the exact Auth.js callback URL shown by the application to the Google OAuth client. Do not expose variables lacking the `NEXT_PUBLIC_` prefix to browser code.

After Vercel assigns the final domain, update FastAPI `SENTINELOPS_CORS_ORIGINS` to that exact HTTPS origin and redeploy the API. Preview deployments need an explicit preview-origin strategy; never use `*`.

## Validation

```bash
curl --fail https://API-DOMAIN/health
curl --fail https://API-DOMAIN/ready
curl --fail https://WEB-DOMAIN/robots.txt
curl --fail https://WEB-DOMAIN/sitemap.xml
```

Open the browser network panel and confirm session creation uses the API host, the WebSocket uses `wss://`, reconnect works, and the page displays an API-unavailable state when the API is intentionally stopped.

## Troubleshooting

- **CORS failure:** Compare the browser `Origin` byte-for-byte with the JSON array in `SENTINELOPS_CORS_ORIGINS`; include scheme and omit paths/trailing routes.
- **WebSocket closes with 4401:** The browser lost its tab-scoped stream capability. Start a new investigation in the same tab.
- **WebSocket closes with 4403:** The production Origin is missing from the API allowlist.
- **Sessions disappear:** Confirm a single worker/replica and inspect provider restarts or sleeping-instance policy. Active sessions are intentionally ephemeral.
- **Atlas unavailable:** Verify `mongodb+srv`, network access, database user, TLS, and database name. The public lab can continue; saved history cannot.
- **OAuth redirect error:** Verify `AUTH_URL`, Google authorized redirect URI, secure cookies, and the final Vercel hostname.
- **Vercel build uses wrong directory:** Keep the project root at repository root so workspace packages and lockfile are available.
- **Health passes but UI cannot connect:** `/health` is liveness; use `/ready`, inspect CORS, and confirm `NEXT_PUBLIC_API_URL` was present at build time.
