# Phase 8 implementation plan

1. Extend the allowlisted FastAPI registry with four complete, declarative built-in incident profiles. Keep hidden truth and scoring material server-only.
2. Generalize deterministic telemetry, stages, topology, evidence validation, action effects, recovery checks, scoring, and reports around those profiles without accepting executable scenario modules.
3. Add a strict shared custom-scenario schema and validator with bounded declarative fields, allowlisted metric/event/action types, topology and reachability checks, content safety checks, and deterministic preview generation.
4. Add owner-scoped versioned `saved_scenarios` persistence APIs. Drafts remain private; meaningful edits after completed use create a new immutable version. Support validation, duplication, archive, preview, and private test-run manifests.
5. Build authenticated scenario-builder list, create/edit, and preview routes with accessible topology, timeline, telemetry samples, validation feedback, and explicit private status.
6. Add built-in engine, recovery-path, builder safety, ownership, versioning, preview, duplicate, and archive tests; update architecture, schema, safety, data-model, API, roadmap, and scenario documentation.

Phase 8 does not add a marketplace, team editing, executable templates, network access, file access, shell commands, or connections to real infrastructure.
