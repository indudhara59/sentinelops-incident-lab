# Evidence model

Evidence is observational material, not an answer label. Each item has a stable ID, source, fictional timestamp, service, neutral summary, relevant structured fields, player annotation, and related hypothesis IDs.

Phase 3 sources are Logs, Metrics, Traces, Deployments, and Alerts. Items become available at deterministic simulated times and can be collected once. Players may annotate an item and attach it to any hypothesis. The reciprocal relation is recorded on both the evidence item and hypothesis.

Hypotheses have a title, notes, attached evidence IDs, and one player-controlled state: unresolved, supported, or contradicted. The engine never automatically marks a hypothesis correct or wrong. A cautious root-cause prompt appears only after the configured evidence threshold is met or the incident is completed; it still asks the player to validate the conclusion.

Authoritative evidence and hypotheses remain in the ephemeral FastAPI session. Phase 6 requires at least three root-cause evidence links spanning two sources and at least two recovery evidence links. A collected item is never labelled correct or incorrect; the final rubric assesses diversity, support, and relationship to the conclusion. No permanent history is produced.
