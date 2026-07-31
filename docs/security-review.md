# Phase 10 security review

Review date: 31 July 2026.

## Results

- Authentication uses Google OAuth through Auth.js; no passwords are stored. Production cookies are secure, HTTP-only, SameSite Lax, and scoped to `/`.
- Redirect callbacks accept only same-origin absolute URLs or validated root-relative paths.
- Dashboard, settings, and scenario-builder pages are protected. API handlers derive the owner from Auth.js rather than request data.
- Incident, report, evidence, hypothesis, preference, learning, and custom-scenario queries put immutable `ownerId` in every owned filter. Identifiers, sort fields, filters, page sizes, and arrays are bounded.
- WebSocket sessions now require a separate cryptographic stream capability. Production rejects missing or non-allowlisted Origin headers before accepting a connection.
- FastAPI validates state transitions under a per-session lock, enforces idempotency and rate limits, bounds all retained data and subscriber queues, cancels timers on deletion/expiry/shutdown, and returns structured generic errors.
- Validation responses omit rejected input values. Structured request logs include method, path, status, duration, and request ID—never bodies, query strings, cookies, authorization values, or Atlas credentials.
- Next.js and FastAPI return defensive content-type, framing/referrer/permission policies. Vercel adds HSTS in production. FastAPI production CORS requires explicit HTTPS non-loopback origins.
- CSV export protects formula-leading cells. Custom scenarios cannot contain code, commands, unsafe templates, arbitrary URLs/hostnames, credentials, file paths, network destinations, or executable regular expressions.

## Known residual risks

- The simulation engine is an ephemeral single-process service. A restart loses active simulations, and multiple workers would split state. This is a documented architectural choice, not a durable incident system.
- FastAPI sessions are educational anonymous capabilities rather than Auth.js-owned records. Persistent history is owner-protected in Next.js; the ephemeral API does not receive Auth.js cookies across origins.
- The Next.js CSP permits inline scripts and styles required by the current framework output. `frame-ancestors`, object, base, form, image, and connection destinations remain restricted. A nonce-based CSP is recommended if the framework/deployment adopts a compatible dynamic rendering strategy.
- Rate limiting is per session, not a distributed IP/account limiter. Platform edge limits should supplement it in production.
- The supported ESLint 9 development toolchain currently retains a high-severity `brace-expansion` denial-of-service advisory in its file-glob dependency. ESLint 10 fixes the dependency but is not yet compatible with the Next.js React and accessibility plugins. Lint runs only against trusted repository paths; production dependency audits are clean and remain the deployment gate. Upgrade when the plugin peer ranges support ESLint 10.
- Dependency audits identify known advisories, not malicious packages or unknown vulnerabilities.

## Deployment operator checklist

Use separate preview and production Atlas databases, restrict Atlas network access, rotate credentials, configure exact Vercel origins in FastAPI CORS, require HTTPS/WSS, keep the API at one worker, protect provider dashboards with MFA, and review audit results before promotion.
