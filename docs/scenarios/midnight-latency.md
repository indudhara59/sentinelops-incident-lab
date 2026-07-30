# The Midnight Latency Incident

This fictional Northstar Market scenario models checkout degradation after order-service version 2.14.7 is deployed. The simulated fault fails to release database connections, leading to pool saturation, order latency, and checkout errors.

## Topology

Web frontend → API gateway → authentication, catalog, cart, and order services. Order service depends on the PostgreSQL-compatible orders database, payment service, and message queue; the queue feeds notification service. All ten nodes are local state descriptions, not real endpoints.

## Investigation signals

Deployment history establishes recent change context. Metrics show stable request volume alongside pool saturation. Logs report connection acquisition timeouts. Traces separate connection waiting from query execution. Alerts describe latency and checkout impact. None is labelled correct or incorrect.

## Mitigation behavior

Rollback deterministically begins mitigation and leads to recovery. Restarting, scaling, raising the pool, disabling retries, pausing the consumer, and observing each have explicit local effects and risks. Only impactful actions require confirmation. No control executes an operational command.

The root-cause conclusion is withheld until the evidence-linked investigation, recovery verification, and report completion gates all pass.

## Phase 6 completion

The player submits a structured conclusion without receiving correctness feedback, links at least three evidence items across two sources, and records rejected alternatives. After rollback, FastAPI requires three stable metric intervals, normalized latency/errors/pool usage, and a successful checkout trace. Only then can documentation produce the deterministic report and reveal the backend-only truth and rubric.
