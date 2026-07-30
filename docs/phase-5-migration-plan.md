# Phase 5 migration plan

This plan was recorded after the Phase 4 verification suite passed and before Phase 5 implementation edits.

## Existing ownership

The browser currently owns the simulation clock, deterministic reducer, telemetry generation, evidence, hypotheses, alert workflow, and action effects. A single React interval advances the reducer. FastAPI exposes health and status only. A tab-local `sessionStorage` record validates workspace entry.

## Target ownership

FastAPI will own an allowlisted scenario registry and every authoritative session field: seed, clock, lifecycle state, telemetry, timeline, actions, evidence, and hypotheses. An in-memory session store will provide per-session locks, TTL cleanup, capacity and rate limits, bounded histories, request idempotency, and safe cancellation. It is intentionally ephemeral and single-process; no persistence or authentication is implied.

The browser will own only presentation concerns such as the selected service, active tool, expanded rows, chart cursor, and correlation URL. It will render server snapshots, send validated commands, and reconcile versioned event batches. The existing local reducer remains available only as a clearly labelled optional educational fallback when the API cannot create or restore a session.

## Delivery protocol

Session creation returns an initial snapshot. A WebSocket sends a snapshot on connection followed by versioned batches containing telemetry, alerts, timeline additions, state changes, action results, and recovery status. The client tracks the highest event sequence, ignores duplicates, and requests a fresh snapshot after reconnect or a detected gap. If WebSockets are unavailable, one snapshot poll retrieves a whole batch at a controlled interval; the client never requests individual telemetry items.

## Compatibility sequence

1. Add shared server models, deterministic engine, registry, and bounded in-memory store without changing the browser.
2. Add REST commands and the session WebSocket with structured request IDs and errors.
3. Add a client transport adapter and connection-state UI, retaining local presentation state.
4. Change briefing start to prefer API session creation and store only the returned ephemeral reference.
5. Verify deterministic replay, lifecycle validation, limits, reconnect reconciliation, cancellation, and API-unavailable fallback before removing any compatibility path.

## Non-goals

This phase adds no database, user identity, durable history, team synchronization, scoring, reports, arbitrary scenario loading, executable scenario code, shell access, or real telemetry collector.
