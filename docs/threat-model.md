# Threat model

## System and trust boundaries

The public Next.js application runs on Vercel. Auth.js and owner-scoped persistence execute in that application. The stateful FastAPI simulation engine runs as one long-lived Render or Railway process and communicates directly with the browser over HTTPS and WSS. MongoDB Atlas stores bounded account-owned summaries and private declarative scenarios. Vercel never hosts the in-memory simulation store.

Protected assets include Auth.js sessions, immutable owner identifiers, incident history, reports, learning progress, private scenario drafts, ephemeral simulation state, WebSocket capabilities, Atlas credentials, OAuth credentials, and deployment secrets.

## Threats and controls

| Threat                            | Primary controls                                                                                                                                       | Residual risk                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Account takeover                  | Google OAuth, Auth.js secure HTTP-only cookies, 12-hour sessions, TLS                                                                                  | Compromised Google account or browser remains upstream risk                          |
| IDOR / cross-user access          | Owner ID derived server-side; every owned read, update, delete, replay, and export filters by owner                                                    | Programming regressions require continued tests and review                           |
| MongoDB operator injection        | Typed/sanitized scalar filters, allowlisted sorting, identifier patterns, bounded pagination; no request object is spread into a query                 | Atlas and driver vulnerabilities remain dependency risk                              |
| WebSocket hijacking               | Cryptographic session ID, separate 256-bit stream capability, production Origin allowlist, TLS/WSS, bounded subscriber queue                           | Capability theft within the same browser session grants stream read access until TTL |
| CSRF                              | SameSite=Lax Auth.js cookie, same-origin persistence APIs, non-idempotent simulation calls use capability-like session IDs and idempotency keys        | Same-origin script compromise can act as the user                                    |
| XSS                               | React escaping, declarative scenario rendering, CSP, no executable templates, safe URL allowlists                                                      | Next.js currently requires inline script/style allowances in CSP                     |
| Secret/error leakage              | Generic persistence/API errors, input values removed from validation errors, connection details withheld, structured logs exclude bodies/query strings | Platform logs and third-party OAuth/Atlas controls require correct configuration     |
| Resource exhaustion               | Session count and TTL, per-session rate limits, bounded events/telemetry/actions/evidence, one runner per session, queue bounds, request field limits  | In-memory store is per-process and intentionally not horizontally scaled             |
| Malicious custom scenario         | Fixed declarative schema, field and content scanning, allowlisted actions/events/metrics, graph/range/recovery validation, private ownership           | Content moderation is not a substitute for schema safety                             |
| CSV formula injection             | Export cells beginning with `=`, `+`, `-`, or `@` are prefixed safely                                                                                  | Spreadsheet import behavior varies                                                   |
| SSRF / real-infrastructure access | No URL/network/hostname fields in custom scenarios; no shell/file/network execution; fixed API destinations from deployment env                        | Misconfigured deployment environment can point the web client at an unintended API   |
| Supply-chain compromise           | Lockfile, least-privilege CI, scheduled `pnpm audit` and `pip-audit`, Dependabot-compatible manifests                                                  | Audit databases can lag and cannot prove absence of vulnerabilities                  |

## Abuse cases outside scope

The project is not a penetration-testing platform, secrets manager, production observability collector, certification system, or team incident commander. Public marketplace moderation and multiplayer authorization do not exist.
