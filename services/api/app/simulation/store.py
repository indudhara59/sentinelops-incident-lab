from __future__ import annotations

import asyncio
import secrets
import time
from collections import deque
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from app.simulation.engine import MAX_EVENTS, advance, initial_state, perform_action
from app.simulation.models import EventEnvelope
from app.simulation.registry import ScenarioDefinition


class StoreError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass
class Session:
    id: str
    scenario: ScenarioDefinition
    seed: int
    state: dict[str, Any]
    created_at: float
    expires_at: float
    version: int = 0
    sequence: int = 0
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    events: deque[EventEnvelope] = field(default_factory=lambda: deque(maxlen=MAX_EVENTS))
    idempotency: dict[str, dict[str, Any]] = field(default_factory=dict)
    subscribers: set[asyncio.Queue[EventEnvelope]] = field(default_factory=set)
    request_times: deque[float] = field(default_factory=deque)
    runner: asyncio.Task[None] | None = None
    cancelled: bool = False

    def snapshot(self) -> dict[str, Any]:
        return {
            **self.state,
            "sessionId": self.id,
            "version": self.version,
            "sequence": self.sequence,
            "expiresAt": (
                datetime.now(UTC) + timedelta(seconds=max(0, self.expires_at - time.monotonic()))
            ).isoformat(),
        }


class SessionStore:
    def __init__(
        self,
        *,
        max_sessions: int = 50,
        ttl_seconds: int = 1_800,
        rate_limit: int = 120,
    ) -> None:
        self.max_sessions = max_sessions
        self.ttl_seconds = ttl_seconds
        self.rate_limit = rate_limit
        self.sessions: dict[str, Session] = {}
        self._lock = asyncio.Lock()

    async def create(self, scenario: ScenarioDefinition, seed: int | None = None) -> Session:
        await self.cleanup()
        async with self._lock:
            if len(self.sessions) >= self.max_sessions:
                raise StoreError(
                    "SESSION_LIMIT_REACHED", "The active session limit has been reached.", 429
                )
            session_id = f"sim_{secrets.token_hex(16)}"
            chosen_seed = seed if seed is not None else secrets.randbits(32)
            now = time.monotonic()
            session = Session(
                id=session_id,
                scenario=scenario,
                seed=chosen_seed,
                state=initial_state(scenario, chosen_seed),
                created_at=now,
                expires_at=now + self.ttl_seconds,
            )
            self.sessions[session_id] = session
            return session

    async def get(self, session_id: str) -> Session:
        session = self.sessions.get(session_id)
        if session is None or session.cancelled:
            raise StoreError("SESSION_NOT_FOUND", "The simulation session was not found.", 404)
        if time.monotonic() >= session.expires_at:
            await self.delete(session_id)
            raise StoreError("SESSION_EXPIRED", "The simulation session has expired.", 410)
        return session

    def enforce_rate(self, session: Session) -> None:
        now = time.monotonic()
        while session.request_times and session.request_times[0] < now - 60:
            session.request_times.popleft()
        if len(session.request_times) >= self.rate_limit:
            raise StoreError("RATE_LIMITED", "The per-session request limit was exceeded.", 429)
        session.request_times.append(now)

    async def mutate(
        self,
        session: Session,
        *,
        idempotency_key: str | None,
        operation: str,
        callback: Any,
        event_type: str = "state.updated",
        rate_limited: bool = True,
    ) -> dict[str, Any]:
        if rate_limited:
            self.enforce_rate(session)
        async with session.lock:
            cache_key = f"{operation}:{idempotency_key}" if idempotency_key else None
            if cache_key and cache_key in session.idempotency:
                return session.idempotency[cache_key]
            previous_tick = session.state["tick"]
            try:
                session.state = callback(session.state)
            except ValueError as exc:
                raise StoreError("INVALID_TRANSITION", str(exc), 409) from exc
            session.version += 1
            telemetry = session.state["tick"] != previous_tick
            payload = {
                "version": session.version,
                "snapshot": session.snapshot(),
                "telemetry": {
                    "logs": session.state["logs"][-2:] if telemetry else [],
                    "metrics": session.state["metrics"][-1:] if telemetry else [],
                    "traces": session.state["traces"][-1:] if telemetry else [],
                },
            }
            envelope = self._publish(
                session, "telemetry.batch" if telemetry else event_type, payload
            )
            response = {"event": envelope.model_dump(), "snapshot": session.snapshot()}
            if cache_key:
                if len(session.idempotency) >= 100:
                    session.idempotency.pop(next(iter(session.idempotency)))
                session.idempotency[cache_key] = response
            return response

    def _publish(self, session: Session, event_type: str, payload: dict[str, Any]) -> EventEnvelope:
        session.sequence += 1
        envelope = EventEnvelope(
            sequence=session.sequence,
            type=event_type,  # type: ignore[arg-type]
            session_id=session.id,
            payload=payload,
        )
        session.events.append(envelope)
        for queue in tuple(session.subscribers):
            if queue.full():
                with suppress(asyncio.QueueEmpty):
                    queue.get_nowait()
            queue.put_nowait(envelope)
        return envelope

    async def start_runner(self, session: Session) -> None:
        if session.runner and not session.runner.done():
            return

        async def run() -> None:
            try:
                while not session.cancelled:
                    await asyncio.sleep(1 / session.state["speed"])
                    if session.state["status"] == "running":
                        await self.mutate(
                            session,
                            idempotency_key=None,
                            operation="timer",
                            callback=advance,
                            rate_limited=False,
                        )
            except asyncio.CancelledError:
                return

        session.runner = asyncio.create_task(run(), name=f"simulation-{session.id}")

    async def delete(self, session_id: str) -> bool:
        async with self._lock:
            session = self.sessions.pop(session_id, None)
        if session is None:
            return False
        session.cancelled = True
        self._publish(session, "session.cancelled", {"reason": "deleted"})
        if session.runner:
            session.runner.cancel()
            with suppress(asyncio.CancelledError):
                await session.runner
        session.subscribers.clear()
        return True

    async def cleanup(self) -> int:
        now = time.monotonic()
        expired = [
            session_id for session_id, session in self.sessions.items() if now >= session.expires_at
        ]
        for session_id in expired:
            await self.delete(session_id)
        return len(expired)

    async def close(self) -> None:
        for session_id in list(self.sessions):
            await self.delete(session_id)


store = SessionStore()


def action_callback(action: str, target_id: str | None) -> Any:
    return lambda state: perform_action(state, action, target_id)
