# Evidence model

Evidence is observational material, not an answer label. Each item has a stable ID, source, fictional timestamp, service, neutral summary, relevant structured fields, player annotation, and related hypothesis IDs.

Phase 3 sources are Logs, Metrics, Traces, Deployments, and Alerts. Items become available at deterministic simulated times and can be collected once. Players may annotate an item and attach it to any hypothesis. The reciprocal relation is recorded on both the evidence item and hypothesis.

Hypotheses have a title, notes, attached evidence IDs, and one player-controlled state: unresolved, supported, or contradicted. The engine never automatically marks a hypothesis correct or wrong. A cautious root-cause prompt appears only after the configured evidence threshold is met or the incident is completed; it still asks the player to validate the conclusion.

Evidence, hypotheses, and notes remain in React memory for the current tab and are cleared by reset or abandonment. No report or permanent history is produced.
