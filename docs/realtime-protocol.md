# Real-time protocol

Connect to `WS /api/v1/sessions/{id}/stream?after=N`. The first message is a `snapshot` envelope containing current authoritative state and retained events newer than `N`. Later envelopes have a monotonically increasing `sequence`, `session_id`, `type`, and `payload`.

Event types are `telemetry.batch`, `state.updated`, `action.result`, and `session.cancelled`. A telemetry batch carries the new snapshot plus up to two logs, one metric sample, and one trace for an interval; alerts, timeline, recovery, and lifecycle status are represented in that same versioned snapshot.

Clients retain the highest applied sequence, discard duplicates, and reconnect with `after`. They always apply the connection snapshot before new events. A sequence gap or socket failure triggers snapshot resynchronization. After repeated socket failures, the browser polls `GET /snapshot?after=N` every three seconds; each response is a bounded event batch plus one snapshot, never one request per telemetry item.

Subscriber queues are bounded. If a slow connection falls behind, old queued notifications may be dropped because the next snapshot is authoritative. Deleting or expiring a session cancels its runner and emits cancellation before subscribers are released.
