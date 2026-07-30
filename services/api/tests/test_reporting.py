from copy import deepcopy
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.engine import ENGINE_VERSION, advance, initial_state, perform_action
from app.simulation.models import (
    CompletionRequest,
    RecoveryVerificationRequest,
    RootCauseSubmission,
)
from app.simulation.registry import MIDNIGHT_LATENCY
from app.simulation.reporting import (
    complete_incident,
    record_root_cause,
    recovery_signals,
    safe_csv_cell,
    timeline_csv,
    verify_recovery,
)
from app.simulation.store import store

client = TestClient(app, raise_server_exceptions=False)


def evidence(identifier: str, source: str) -> dict[str, Any]:
    return {
        "id": identifier,
        "source": source,
        "timestamp": "T+150s",
        "service": "order",
        "summary": f"Simulated {source} evidence",
        "fields": {"simulated": True},
        "annotation": "Supports connection-wait investigation.",
        "hypothesisIds": ["hyp-1"],
    }


def prepared_state() -> dict[str, Any]:
    state = initial_state(MIDNIGHT_LATENCY, 73)
    state["status"] = "paused"
    for _ in range(5):
        state = advance(state)
        state["status"] = "paused"
    state["collectedEvidence"] = [
        evidence("ev-logs", "Logs"),
        evidence("ev-metrics", "Metrics"),
        evidence("ev-traces", "Traces"),
        evidence("ev-deploy", "Deployments"),
        evidence("ev-alert", "Alerts"),
    ]
    state["hypotheses"] = [
        {
            "id": "hyp-1",
            "title": "Connection lifecycle regression",
            "notes": "Deployment correlation and database wait spans support this.",
            "status": "supported",
            "evidenceIds": ["ev-logs", "ev-metrics", "ev-traces", "ev-deploy"],
        },
        {
            "id": "hyp-2",
            "title": "Traffic surge",
            "notes": "Request rate remained stable.",
            "status": "contradicted",
            "evidenceIds": ["ev-metrics"],
        },
    ]
    state = perform_action(state, "rollback")
    for _ in range(4):
        state = advance(state)
    return state


def correct_submission() -> RootCauseSubmission:
    return RootCauseSubmission(
        affected_service="order-service",
        failure_mechanism="database-connections-not-released",
        triggering_change="order-service-2.14.7-deployment",
        supporting_evidence=["ev-logs", "ev-metrics", "ev-traces", "ev-deploy"],
        rejected_alternatives=["Traffic surge contradicted by stable request rate."],
        proposed_mitigation="rollback-order-service-2.14.7",
        confidence=88,
    )


def documentation() -> CompletionRequest:
    return CompletionRequest(
        incident_summary=(
            "Checkout degraded after the order-service deployment and recovered after rollback."
        ),
        customer_impact="Customers experienced slow and failed checkout attempts.",
        lessons_learned=["Monitor pool wait duration by deployment version."],
        follow_up_actions=["Add connection lifecycle regression tests."],
    )


def completed_state(submission: RootCauseSubmission | None = None) -> dict[str, Any]:
    state = prepared_state()
    state = record_root_cause(state, submission or correct_submission())
    state = verify_recovery(
        state,
        RecoveryVerificationRequest(
            evidence_ids=["ev-metrics", "ev-traces"],
            observation=(
                "Three stable intervals show normal latency, errors, pool usage, and traces."
            ),
        ),
    )
    return complete_incident(state, MIDNIGHT_LATENCY, documentation())


def score_map(state: dict[str, Any]) -> dict[str, int]:
    return {item["category"]: item["score"] for item in state["report"]["score"]["breakdown"]}


def test_score_calculation_and_boundaries() -> None:
    state = completed_state()
    score = state["report"]["score"]
    assert 0 <= score["total"] <= score["maximum"] == 100
    assert len(score["breakdown"]) == 10
    assert all(0 <= item["score"] <= item["maximum"] == 10 for item in score["breakdown"])
    assert score_map(state)["Root-cause identification"] == 10
    assert score_map(state)["Mitigation selection"] == 10


def test_evidence_requirements_and_unsupported_conclusion() -> None:
    state = prepared_state()
    with pytest.raises(ValueError, match="was not collected"):
        record_root_cause(
            state,
            correct_submission().model_copy(
                update={"supporting_evidence": ["ev-logs", "ev-metrics", "missing"]}
            ),
        )
    unsupported = correct_submission().model_copy(
        update={
            "affected_service": "payment-service",
            "failure_mechanism": "payment-provider-latency",
            "triggering_change": "traffic-increase",
            "confidence": 99,
        }
    )
    report = completed_state(unsupported)
    assert score_map(report)["Root-cause identification"] < 10


def test_temporary_and_risky_actions_are_distinguished() -> None:
    correct = completed_state()
    temporary = deepcopy(correct)
    temporary["actions"] = [{"action": "restart", "second": 150}]
    temporary["rootCauseSubmission"]["proposed_mitigation"] = "restart-order-service"
    temporary = complete_incident(temporary, MIDNIGHT_LATENCY, documentation())
    assert score_map(temporary)["Mitigation selection"] == 5
    risky = deepcopy(correct)
    risky["actions"].extend(
        [{"action": "increase-pool", "second": 150}] * 3
        + [{"action": "restart", "second": 180}] * 3
    )
    risky = complete_incident(risky, MIDNIGHT_LATENCY, documentation())
    assert score_map(risky)["Operational safety"] < score_map(correct)["Operational safety"]


def test_restart_relief_expires_without_fixing_the_incident() -> None:
    state = initial_state(MIDNIGHT_LATENCY, 44)
    state["status"] = "paused"
    for _ in range(5):
        state = advance(state)
        state["status"] = "paused"
    state = perform_action(state, "restart")
    relieved = advance(state)
    later = advance(advance(advance(relieved)))
    assert relieved["metrics"][-1]["orderLatencyMs"] < later["metrics"][-1]["orderLatencyMs"]
    assert later["stage"] == "Checkout errors"
    assert later["mitigationAt"] is None


def test_recovery_and_premature_completion_prevention() -> None:
    state = initial_state(MIDNIGHT_LATENCY, 9)
    assert not recovery_signals(state)["verified"]
    with pytest.raises(ValueError, match="root-cause"):
        complete_incident(state, MIDNIGHT_LATENCY, documentation())
    state = record_root_cause(prepared_state(), correct_submission())
    state["metrics"] = state["metrics"][-2:]
    with pytest.raises(ValueError, match="not yet stable"):
        verify_recovery(
            state,
            RecoveryVerificationRequest(
                evidence_ids=["ev-metrics", "ev-traces"],
                observation="The short window looks better but needs additional stable samples.",
            ),
        )


def test_report_and_deterministic_replay_manifest() -> None:
    first = completed_state()
    second = completed_state()
    assert first["report"] == second["report"]
    replay = first["report"]["replay"]
    assert replay["scenarioVersion"] == MIDNIGHT_LATENCY.version
    assert replay["engineVersion"] == ENGINE_VERSION
    replayed = initial_state(MIDNIGHT_LATENCY, replay["seed"])
    replayed["status"] = "paused"
    while replayed["elapsedSeconds"] < replay["actions"][0]["second"]:
        replayed = advance(replayed)
        replayed["status"] = "paused"
    replayed = perform_action(replayed, replay["actions"][0]["action"])
    assert replayed["mitigationAt"] == first["mitigationAt"]


def test_csv_injection_protection_and_disclaimer() -> None:
    assert [safe_csv_cell(value) for value in ("=2+2", "+cmd", "-1", "@formula")] == [
        "'=2+2",
        "'+cmd",
        "'-1",
        "'@formula",
    ]
    report = completed_state()["report"]
    report["timeline"].append(
        {"second": 1, "kind": "action", "title": "=formula", "description": "+unsafe"}
    )
    exported = timeline_csv(report)
    assert "'=formula" in exported and "'+unsafe" in exported
    assert "not an official sre certification" in report["disclaimer"].lower()


def test_report_json_csv_exports_and_hidden_truth_boundary() -> None:
    created = client.post(
        "/api/v1/sessions",
        json={"scenario_slug": "midnight-latency-incident", "seed": 73},
    )
    assert created.status_code == 201
    session_id = created.json()["id"]
    pre_completion = created.text.lower()
    assert "failed to release" not in pre_completion
    assert "database-connections-not-released" not in pre_completion
    assert "score" not in pre_completion
    state = completed_state()
    state["report"]["sessionId"] = session_id
    store.sessions[session_id].state = state

    report = client.get(f"/api/v1/sessions/{session_id}/report.json")
    assert report.status_code == 200
    assert report.headers["content-type"].startswith("application/json")
    assert report.headers["content-disposition"].endswith('-report.json"')
    assert report.json()["score"]["maximum"] == 100

    timeline = client.get(f"/api/v1/sessions/{session_id}/timeline.csv")
    assert timeline.status_code == 200
    assert timeline.headers["content-type"].startswith("text/csv")
    assert timeline.text.startswith("second,kind,title,description")
    client.delete(f"/api/v1/sessions/{session_id}")
