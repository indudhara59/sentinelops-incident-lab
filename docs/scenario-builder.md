# Private scenario builder

`/scenario-builder` is available only to authenticated owners. New and edit pages expose basics and the complete declarative JSON definition; preview shows topology, ordered timeline, and a bounded deterministic telemetry sample. Owners can validate, privately test, duplicate, and archive their own drafts. Phase 8 has no public marketplace or collaboration.

Validation limits services to 20, dependencies to 60, events to 80, metric patterns to 20, logs to 30, traces to 20, alerts to 30, evidence to 50, hypotheses to 20, and objectives to 12. Text is capped at 2,000 characters per field. Timelines begin at zero and strictly increase; topology is acyclic; metric values are finite and bounded; recovery requires an allowlisted corrective action and two to ten stable intervals; integer score weights total 100.

Private test runs return an in-memory manifest and deterministic telemetry sample for a supplied bounded seed. They do not persist execution, contact FastAPI, execute templates, access files, issue commands, or make network requests. A custom draft remains private even after successful validation.

Historical versions are immutable once referenced by a completed session. Reports and replay manifests use the exact stored scenario version. Editing an unused draft updates its current version; editing a used version creates the next integer version.
