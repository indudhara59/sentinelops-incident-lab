# Alert center and deployments

Alerts expose severity, status, source, first-triggered time, last update, and related telemetry. Acknowledge, assign-to-self, and silence are local simulation actions recorded in the player-action history and incident timeline. They never remove the alert, underlying telemetry, or previously collected evidence.

Alert links open relevant metrics while preserving service and time-window context. The alert timeline provides a chronological text view for assistive technology.

Deployment history contains fictional service versions, times, status, change and diff summaries, rollback availability, and commit-like references prefixed with `sim-`. References are generated content and do not correspond to this or any other repository. Deployment records can be opened from timeline markers and collected as evidence.
