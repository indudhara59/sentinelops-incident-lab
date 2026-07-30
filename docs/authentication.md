# Authentication

Auth.js provides Google OAuth sign-in, sign-out, and database-backed sessions. SentinelOps does not accept or store passwords.

Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `MONGODB_URI`, and `MONGODB_DB_NAME`. In Google Cloud, register the Auth.js callback URL for each deployment, for example `https://example.invalid/api/auth/callback/google`. Production deployments should set their canonical `AUTH_URL`; only enable `AUTH_TRUST_HOST` behind a trusted proxy that overwrites forwarded headers.

Sessions expire after 12 hours and are refreshed at most hourly. Cookies are HTTP-only, SameSite=Lax, path-scoped, and use a `__Secure-` name plus the Secure flag in production. Dashboard and settings routes are protected by the Auth.js proxy and repeat authorization in server components and route handlers.

Redirect destinations must be same-origin paths. External and protocol-relative callback URLs are rejected. If authentication or Atlas is not configured, the sign-in page reports that saving is unavailable; no hidden default account or production demo bypass exists.
