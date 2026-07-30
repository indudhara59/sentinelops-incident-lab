# Persistent data model

Auth.js owns `users`, `accounts`, and `sessions`. SentinelOps owns `incident_sessions`, `incident_reports`, `evidence_items`, `hypotheses`, `saved_scenarios`, and `user_preferences`.

Every application-owned document includes an immutable `ownerId` copied from the authenticated Auth.js user ID. Updates never accept `ownerId` from a request. Child records also contain `incidentSessionId`, and reads, updates, exports, replays, and deletes match both identifiers.

`incident_sessions` stores scenario and engine versions, deterministic seed, status and timestamps, bounded summary metric series, important timeline events, player actions, and final score. Evidence and hypotheses are bounded child documents. Completed reports store the deterministic structured report. Raw logs, traces, high-cardinality metrics, secrets, and real personal data are not stored.

Limits per incident are 24 metric series with 120 points each, 500 important timeline events, 250 actions, 100 evidence items, and 50 hypotheses. Notes are at most 4,000 characters and reports at most 100,000 serialized characters. Incomplete temporary sessions receive a 30-day expiration timestamp; completed records are not covered by that TTL index.

Indexes place `ownerId` first and cover status, scenario, creation, completion, and stable ID/date pagination. Auth.js account and session lookups and child-record uniqueness are also indexed.

## Custom scenarios

`saved_scenarios` stores private declarative drafts with `ownerId`, stable `scenarioId`, integer `version`, schema version, content hash, validation status, archive state, and timestamps. The unique owner/scenario/version index preserves historical versions. Meaningful edits replace an unplayed draft version; after an exact version has completed sessions, edits create the next version. Incident sessions and reports retain the exact scenario version used.
