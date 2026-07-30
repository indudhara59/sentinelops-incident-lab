# Simulated telemetry model

Phase 4 telemetry is produced inside the existing deterministic reducer from the scenario ID, session seed, simulated clock, and ordered player actions. It performs no network requests and does not represent a real environment.

Each simulation interval appends a small batch of mutually correlated logs, metric samples, and traces. Stable trace, span, request, and deployment identifiers make replay and tests reproducible. Alerts and deployments are fixed fictional records whose timestamps use the same simulation clock.

Telemetry histories are bounded before they enter state: logs retain at most 100 records, metrics 120 samples, and traces 60 records. Explorer result lists are also capped, expanded details render on demand, and expensive filters and trace transforms are memoized.

Evidence stores a safe snapshot of the selected log, metric point or range, span, alert, or deployment. Collection does not mutate the source signal. All values are intentionally rounded simulated measurements rather than claims of production-grade precision.

Cross-tool navigation uses validated URL parameters for tool, service, trace, deployment, and time range. The reducer remains the source of truth, so replaying the same state and correlation event produces the same view.
