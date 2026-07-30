# Phase 7 security model

Authentication identifies a user; ownership authorizes access. A session ID by itself never authorizes a persistent operation. Every repository query includes the immutable `ownerId`, including resume, abandon, delete, report access, export, and replay lookups. Missing and cross-user records return the same not-found behavior to reduce identifier disclosure.

Route handlers ignore request-supplied owner fields. Record IDs use a strict ASCII allowlist, status/difficulty/sort values are enumerated, search text is length-limited and escaped before becoming a regular expression, pagination is bounded, and notes/reports/arrays have explicit limits. MongoDB operators cannot be supplied through query JSON. Deletes require an explicit confirmation header and only remove records matched by both owner and incident ID.

Atlas credentials are server-only and never logged. TLS is mandatory, pools and wait queues are bounded, and connection failures return redacted structured errors with a request ID. Production network access should be restricted to deployment egress addresses and the database user should have least privilege.

SentinelOps persists summaries, evidence, hypotheses, actions, scores, and reports—not unbounded telemetry. Simulated logs contain no secrets or real personal data. Phase 7 does not silently implement account deletion: the settings page explains that an identity-verified operational deletion workflow is required.
