# Simulation engine

The Phase 3 engine is a pure TypeScript state machine in `apps/web/lib/simulation`. Its output is determined by four inputs: scenario ID, session seed, simulation time, and ordered player actions. It uses a small seeded hash/noise function only for stable telemetry jitter; it never calls `Math.random`.

## States

The Midnight Latency lifecycle is: Normal, Deployment completed, Connection leak begins, Database pool saturation, Order-service latency increase, Checkout errors, Incident mitigation, Recovery, and Completed. Thirty simulated seconds form one interval. A rollback enters mitigation; recovery and completion follow deterministic offsets.

## Runtime guarantees

- One React effect owns the interval and cancels it whenever status or speed changes and on unmount.
- Pause removes the timer; single-step calls the same pure transition directly.
- Reset reconstructs the initial state with the original numeric seed.
- Metric history is capped at 120 points and logs at 100 entries.
- No transition makes a network request.
- Actions and system transitions append stable timeline events.
- CSS disables transitions and animations under `prefers-reduced-motion`.

Replay tests advance independent states with the same seed and assert structural equality.
