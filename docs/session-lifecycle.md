# Session lifecycle

Creating a session validates the scenario against the registry, chooses a supplied deterministic test seed or cryptographically random default seed, generates a 128-bit random `sim_` identifier, and returns version zero with the initial snapshot.

A session begins `ready`. Resume (also used to start) permits `ready` or `paused` to become `running`; pause permits only `running`; step is rejected while running. The server clock advances one 30-second simulation interval per wall-clock interval adjusted by its fixed speed. Valid actions are serialized with timer ticks by the session lock.

Every mutation increments the version and event sequence. Idempotency results are bounded and replayed for duplicate keys. Deletion, TTL cleanup, application shutdown, or explicit cancellation stops the runner and clears subscribers. Session loss is final because Phase 5 has no database or persistent user history.

The browser stores only scenario, mode, creation time, and session ID in the current tab. If initial API creation fails, it may create a separately labelled local educational fallback; that fallback is never presented as synchronized.
