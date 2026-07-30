# Investigation workspace

`/operations/[sessionId]` accepts only the ready Midnight Latency slug and a correctly shaped local session ID. The client also verifies a matching `sessionStorage` record; copied, expired, cross-tab, malformed, or mismatched sessions receive an invalid-session screen.

The incident header exposes severity, status, elapsed simulated time, impact, start/pause/resume, exit confirmation, single-step, speed, and deterministic reset. The responsive workspace contains:

- a keyboard-selectable visual service topology and complete textual alternative;
- fit/reset controls and a responsive service-detail drawer;
- Overview, Alerts, Logs, Metrics, Traces, Deployments, Evidence, Actions, and Notes tabs;
- screen-reader critical-alert announcements;
- an incident timeline for system events, alerts, actions, and recovery;
- local evidence, hypothesis, annotation, and note workflows.

Arrow Up/Down and Home/End move through the vertical tool tabs. On narrow screens the tools become a horizontal tab strip and the selected-service drawer becomes a bottom overlay.

Phase 4 replaces the compact telemetry summaries with full explorers. Correlation controls update the active tool and a small, validated set of URL search parameters so a filtered investigation view is reproducible. These parameters never contain evidence notes, hypotheses, hidden scenario data, or credentials.
