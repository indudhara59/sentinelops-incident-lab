# Post-incident reports

`/operations/[sessionId]/report` renders the completed ephemeral report: executive summary, customer impact, timeline, alerts, evidence, hypotheses, root cause, contributing factors, actions, recovery checks, score explanations, missed evidence, a better investigation path, lessons, and follow-ups.

The generator is a deterministic structured template over scenario version, engine version, seed, telemetry summaries, evidence, hypotheses, actions and timestamps, recovery verification, and player documentation. It makes no external AI request.

JSON export uses `application/json`; timeline export uses `text/csv`. CSV cells beginning with `=`, `+`, `-`, or `@` receive a leading apostrophe to prevent spreadsheet formula interpretation. Server-generated filenames contain only a validated session ID and fixed suffix. Print CSS removes navigation and controls, preserves readable contrast, and avoids breaking report cards across pages.

The replay manifest contains scenario version, engine version, seed, actions, targets, and simulated timestamps. The browser reconstructs the action sequence with the matching local deterministic engine. A visible warning explains when either version differs and exact replay cannot be promised.
