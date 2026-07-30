# Recovery verification

Recovery is computed by FastAPI from post-mitigation telemetry. All conditions must pass:

- order-service latency remains below 500 ms;
- checkout error rate remains below 1%;
- database pool utilization remains below 70%;
- at least one post-mitigation checkout trace succeeds;
- the last three post-mitigation metric intervals remain stable.

The player must also link at least two collected evidence items and document what was observed. A better single sample cannot complete the incident. Restart, scaling, or a larger pool may improve symptoms, but only a corrective mitigation establishes the recovery window in the Midnight Latency state machine.
