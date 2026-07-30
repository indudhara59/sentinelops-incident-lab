# Operational limits

Phase 5 defaults are development safeguards, configurable through validated `SENTINELOPS_*` settings:

- 50 active sessions per process;
- 30-minute session TTL;
- 120 client requests per session per minute;
- 100 logs, 120 metric samples, 60 traces, and 160 retained events per session;
- 100 actions, 100 evidence items, and 50 hypotheses per session;
- 240 characters for titles and action-adjacent labels, 2,000 for evidence annotation, and 4,000 for hypothesis notes;
- 100 retained idempotency results and 32 pending messages per WebSocket subscriber.

Limits are enforced before or under the per-session lock. Automatic simulation ticks do not consume the client request allowance. Capacity, rate, validation, conflict, expiry, and absence errors have distinct stable codes. Cleanup is safe and cancellable.

The store is process-local. Multiple workers would create unrelated session sets, so this phase should run one API worker. Restarting the process intentionally loses every session.
