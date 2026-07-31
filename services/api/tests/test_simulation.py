import asyncio
import time
from typing import Any

from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.simulation.engine import MAX_LOGS, MAX_METRICS, MAX_TRACES, advance
from app.simulation.registry import get_scenario, list_scenarios
from app.simulation.store import SessionStore, StoreError, action_callback

client = TestClient(app, raise_server_exceptions=False)


def create_session(seed: int = 42) -> dict[str, Any]:
    response = client.post(
        "/api/v1/sessions",
        json={"scenario_slug": "midnight-latency-incident", "seed": seed},
    )
    assert response.status_code == 201
    return response.json()


def test_allowlisted_scenario_registry() -> None:
    scenarios = list_scenarios()
    assert [item.slug for item in scenarios] == [
        "midnight-latency-incident",
        "queue-at-the-breaking-point",
        "memory-under-pressure",
        "authentication-storm",
        "cascading-checkout-failure",
    ]
    assert get_scenario("../../arbitrary.py") is None
    response = client.get("/api/v1/scenarios/midnight-latency-incident")
    assert response.status_code == 200
    assert response.json()["implementation_status"] == "ready"


def test_session_creation_invalid_scenario_and_crypto_id() -> None:
    created = create_session()
    assert created["id"].startswith("sim_")
    assert len(created["id"]) == 36
    assert created["snapshot"]["status"] == "ready"
    invalid = client.post("/api/v1/sessions", json={"scenario_slug": "unknown"})
    assert invalid.status_code == 404
    assert invalid.json()["error"]["code"] == "INVALID_SCENARIO"
    client.delete(f"/api/v1/sessions/{created['id']}")


def test_deterministic_seed_and_batched_step() -> None:
    first = create_session(901)
    second = create_session(901)
    snapshots = []
    for created in (first, second):
        response = client.post(
            f"/api/v1/sessions/{created['id']}/step",
            headers={"Idempotency-Key": "step-one"},
        )
        assert response.status_code == 200
        snapshot = response.json()["snapshot"]
        snapshots.append(
            {key: snapshot[key] for key in ("seed", "tick", "stage", "logs", "metrics", "traces")}
        )
        assert len(response.json()["event"]["payload"]["telemetry"]["logs"]) == 2
        client.delete(f"/api/v1/sessions/{created['id']}")
    assert snapshots[0] == snapshots[1]


def test_transition_validation_and_idempotency() -> None:
    created = create_session()
    session_id = created["id"]
    invalid = client.post(f"/api/v1/sessions/{session_id}/pause")
    assert invalid.status_code == 409
    key = {"Idempotency-Key": "resume-once"}
    first = client.post(f"/api/v1/sessions/{session_id}/resume", headers=key)
    duplicate = client.post(f"/api/v1/sessions/{session_id}/resume", headers=key)
    assert first.status_code == duplicate.status_code == 200
    assert first.json() == duplicate.json()
    assert first.json()["snapshot"]["version"] == 1
    client.delete(f"/api/v1/sessions/{session_id}")


def test_action_validation_error_structure_and_size_limit() -> None:
    created = create_session()
    session_id = created["id"]
    invalid = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "shell"},
        headers={"X-Request-ID": "invalid-action"},
    )
    assert invalid.status_code == 422
    assert invalid.json()["error"]["request_id"] == "invalid-action"
    too_large = client.post(
        f"/api/v1/sessions/{session_id}/hypotheses",
        json={"title": "x" * 241, "notes": "safe"},
    )
    assert too_large.status_code == 422
    client.delete(f"/api/v1/sessions/{session_id}")


def test_memory_bounds() -> None:
    scenario = get_scenario("midnight-latency-incident")
    assert scenario is not None
    from app.simulation.engine import initial_state

    state = initial_state(scenario, 8)
    for _ in range(250):
        state = advance(state)
        if state["status"] == "completed":
            state["status"] = "paused"
            state["mitigationAt"] = None
    assert len(state["logs"]) <= MAX_LOGS
    assert len(state["metrics"]) <= MAX_METRICS
    assert len(state["traces"]) <= MAX_TRACES


def test_session_limit_ttl_cleanup_rate_limit_and_cancellation() -> None:
    async def exercise() -> None:
        scenario = get_scenario("midnight-latency-incident")
        assert scenario is not None
        limited = SessionStore(max_sessions=1, ttl_seconds=60, rate_limit=1)
        session = await limited.create(scenario, 1)
        try:
            await limited.create(scenario, 2)
            raise AssertionError("capacity error expected")
        except StoreError as exc:
            assert exc.code == "SESSION_LIMIT_REACHED"
        limited.enforce_rate(session)
        try:
            limited.enforce_rate(session)
            raise AssertionError("rate error expected")
        except StoreError as exc:
            assert exc.code == "RATE_LIMITED"
        session.expires_at = time.monotonic() - 1
        assert await limited.cleanup() == 1
        assert session.cancelled
        assert not limited.sessions

    asyncio.run(exercise())


def test_concurrent_actions_are_serialized() -> None:
    async def exercise() -> None:
        scenario = get_scenario("midnight-latency-incident")
        assert scenario is not None
        isolated = SessionStore(rate_limit=1000)
        session = await isolated.create(scenario, 7)
        await asyncio.gather(
            *[
                isolated.mutate(
                    session,
                    idempotency_key=f"action-{index}",
                    operation="action",
                    callback=action_callback("observe", None),
                )
                for index in range(20)
            ]
        )
        assert len(session.state["actions"]) == 20
        assert session.version == 20
        await isolated.close()

    asyncio.run(exercise())


def test_websocket_snapshot_and_reconnection_history() -> None:
    created = create_session()
    session_id = created["id"]
    stream_token = created["stream_token"]
    client.post(f"/api/v1/sessions/{session_id}/step")
    with client.websocket_connect(
        f"/api/v1/sessions/{session_id}/stream?after=0",
        subprotocols=[f"sentinelops.{stream_token}"],
    ) as socket:
        message = socket.receive_json()
        assert message["type"] == "snapshot"
        assert message["payload"]["snapshot"]["tick"] == 1
        assert message["payload"]["events"]
    resync = client.get(f"/api/v1/sessions/{session_id}/snapshot?after=0")
    assert resync.status_code == 200
    assert resync.json()["events"][0]["type"] == "telemetry.batch"
    client.delete(f"/api/v1/sessions/{session_id}")


def test_websocket_rejects_missing_stream_capability() -> None:
    created = create_session()
    try:
        with client.websocket_connect(f"/api/v1/sessions/{created['id']}/stream"):
            raise AssertionError("Missing capability must not connect")
    except WebSocketDisconnect as exc:
        assert exc.code == 4401


def test_stream_capability_is_not_returned_by_session_read() -> None:
    created = create_session()
    response = client.get(f"/api/v1/sessions/{created['id']}")
    assert response.status_code == 200
    assert response.json()["stream_token"] is None


def test_generated_openapi_documents_phase_five_routes() -> None:
    schema = app.openapi()
    paths = schema["paths"]
    assert "/api/v1/scenarios" in paths
    assert "/api/v1/sessions" in paths
    assert "/api/v1/sessions/{session_id}/snapshot" in paths
    assert "/api/v1/sessions/{session_id}/hypotheses/{hypothesis_id}" in paths
    assert "/api/v1/sessions/{session_id}/root-cause" in paths
    assert "/api/v1/sessions/{session_id}/recovery/verify" in paths
    assert "/api/v1/sessions/{session_id}/complete" in paths
    assert "/api/v1/sessions/{session_id}/report" in paths
