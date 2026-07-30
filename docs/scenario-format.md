# Scenario format

Scenario content is typed in `@sentinelops/shared` and split into public and private definitions.

## Public definition

`PublicScenarioDefinition` contains only information a learner may see before an investigation:

- stable ID and URL slug;
- title, fictional description, difficulty, duration, organization, and environment;
- severity, categories, affected services, and initial alerts;
- learning objectives and required evidence categories;
- deterministic timeline configuration and implementation status;
- initial notification, known impact, and available simulated tools.

This data powers the client-side catalog and briefing. Wording must not imply a real organization or disclose the answer.

## Private definition

`PrivateScenarioDefinition` lives in `apps/web/data/scenario-secrets.ts`, which imports `server-only`. It includes:

- root-cause summary;
- valid corrective actions;
- explanations for incorrect actions;
- hidden evidence.

Never import the private module from a Client Component or serialize it into page props. Phase 2 stores these definitions for future facilitator logic but does not execute or display them.

Phase 6 also defines an equivalent backend-only `TruthModel` in the allowlisted FastAPI registry for authoritative completion and scoring. API scenario responses and pre-completion snapshots serialize only the public model and player-recorded state; they never serialize this truth object.

## Status values

- `ready` — briefing can create a temporary local handoff to the Phase 3 placeholder.
- `preview` — substantial content exists, but the future engine is incomplete.
- `planned` — briefing is available for review; simulation work has not started.

Adding a scenario requires a unique ID and slug, a public record, a matching private record, and tests confirming uniqueness and the absence of private field names in public data.
