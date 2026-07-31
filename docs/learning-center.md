# Learning center

Phase 9 provides public learning routes under `/learn`. The reference library covers observability, logs, metrics, traces, alerts, incident triage, root-cause analysis, mitigation, post-incident reviews, OpenTelemetry, SRE fundamentals, and a glossary. Content is original and uses the same fictional, simulated safety boundary as the lab.

## Guided journey

The ten course steps progress from system orientation and the first alert through impact, telemetry correlation, change review, hypotheses, mitigation, recovery, and reporting. Each step includes one keyboard-accessible knowledge check. An answer always produces an explanation; correct answers update progress. The course is educational and issues no certificate or employment assessment.

Guest progress is a bounded record in browser local storage. When Auth.js provides an immutable owner ID, the same record is saved in the `learning_progress` collection under a unique `(ownerId, courseVersion)` index. API failure falls back to the local record without blocking public content. Reset is explicit and confirmed. No telemetry, answer history, or free-form learner content is stored.

## Editorial distinctions

- Logs are discrete event records, metrics describe numeric behavior across a population or window, and traces follow individual units of work across operations.
- A symptom is observed impact or behavior; a root-cause claim explains the mechanism and conditions that produced it.
- Correlation guides investigation but does not establish causation without a credible mechanism, correct ordering, and evidence against alternatives.
- Mitigation reduces present harm; permanent remediation removes or prevents the underlying defect.
- A blameless incident review examines decisions and contributing system conditions rigorously without turning learning into personal accusation.

## Authoritative references

The learning copy is independently written. These primary public references informed terminology and provide deeper reading:

- [OpenTelemetry: What is OpenTelemetry?](https://opentelemetry.io/docs/what-is-opentelemetry/) explains that OpenTelemetry is a vendor-neutral framework and toolkit for generating, collecting, and exporting telemetry, not an observability backend.
- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) defines supported telemetry-signal categories.
- [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/) introduces observability, reliability, metrics, logs, spans, and distributed traces.
- [OpenTelemetry logs](https://opentelemetry.io/docs/concepts/signals/logs/), [metrics](https://opentelemetry.io/docs/concepts/signals/metrics/), and [traces](https://opentelemetry.io/docs/concepts/signals/traces/) provide signal-specific concepts.
- [OpenTelemetry logging specification](https://opentelemetry.io/docs/specs/otel/logs/) documents correlation by time, trace context, and resource context.
- [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) discusses user-visible and internal monitoring, alerts, and incident terminology.
- [Google SRE: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) describes post-incident documentation, contributing causes, preventive actions, and blameless learning.

References were reviewed on 31 July 2026. External documentation can evolve; the application does not copy or dynamically fetch it.
