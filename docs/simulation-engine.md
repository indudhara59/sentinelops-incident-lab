# Simulation engine

The authoritative Phase 5 engine is a pure Python transition layer in `services/api/app/simulation`. Its output is determined by scenario definition, numeric seed, simulation clock, current state, and ordered player actions. Randomness is used only to create session IDs and default seeds; telemetry jitter itself is seeded and replayable.

## States

The Midnight Latency lifecycle is: Normal, Deployment completed, Connection leak begins, Database pool saturation, Order-service latency increase, Checkout errors, Incident mitigation, Recovery, and Completed. Thirty simulated seconds form one interval. A rollback enters mitigation; recovery and completion follow deterministic offsets.

## Runtime guarantees

- One cancellable FastAPI task owns each running session clock.
- Per-session locks serialize timer ticks and commands; pause, resume, and step validate their source states.
- Idempotency keys return the original mutation result instead of applying it twice.
- Metric history is capped at 120 points and logs at 100 entries.
- The engine transition layer makes no network request and cannot execute Python or shell input.
- Actions and system transitions append stable timeline events.
- CSS disables transitions and animations under `prefers-reduced-motion`.

The former TypeScript reducer remains available for the explicit offline educational fallback. Replay tests advance independent server states with the same seed and assert structural equality.
