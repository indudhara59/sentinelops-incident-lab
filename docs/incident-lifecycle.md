# Incident lifecycle

The product lifecycle is deliberately divided into stages so a page never claims capabilities that do not exist.

1. **Discover** — search and filter fictional scenarios in the local catalog.
2. **Brief** — review severity, notification, known impact, initial alerts, environment, learning goals, and rules of engagement.
3. **Prepare** — use the incident commander checklist to establish a disciplined investigation sequence.
4. **Start ephemerally** — request a cryptographically identified in-memory FastAPI session and keep only its reference in the current tab.
5. **Investigate** — render authoritative snapshots and batched events, collect evidence, build hypotheses, and record safe simulated actions.
6. **Mitigate and verify** — observe deterministic recovery after an appropriate simulated action.
7. **Conclude** — submit affected service, mechanism, trigger, evidence, rejected alternatives, mitigation, and confidence.
8. **Report** — verify recovery, document the incident, review the scoring rationale, export, print, or replay locally.

Phase 6 supports investigation through post-incident report for one ready scenario. Sessions and reports expire without durable history. It does not authenticate users or assess employment suitability.

## Incident commander checklist

The briefing makes the expected sequence explicit: confirm impact, check recent changes, review telemetry, build hypotheses, collect evidence, mitigate, verify recovery, and document findings. This is educational guidance within a fictional exercise, not an automated response procedure for real systems.
