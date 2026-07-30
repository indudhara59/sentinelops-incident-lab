import pytest

from app.simulation.engine import (
    MAX_LOGS,
    MAX_METRICS,
    MAX_TRACES,
    advance,
    initial_state,
    perform_action,
)
from app.simulation.models import CompletionRequest
from app.simulation.registry import (
    AUTH_STORM,
    CASCADING_CHECKOUT,
    MEMORY_PRESSURE,
    QUEUE_BREAKING_POINT,
    ScenarioDefinition,
)
from app.simulation.reporting import complete_incident, recovery_signals

BUILT_INS = (QUEUE_BREAKING_POINT, MEMORY_PRESSURE, AUTH_STORM, CASCADING_CHECKOUT)


@pytest.mark.parametrize("scenario", BUILT_INS, ids=lambda item: item.public.slug)
def test_builtin_engine_is_deterministic_distinct_and_bounded(scenario: ScenarioDefinition) -> None:
    left = initial_state(scenario, 90210)
    right = initial_state(scenario, 90210)
    for _ in range(8):
        left = advance(left)
        right = advance(right)
    assert left == right
    assert left["stage"] == scenario.stages[-1][1]
    assert {item["id"] for item in left["services"]} == {
        item.id for item in scenario.runtime.services
    }
    assert len(left["logs"]) <= MAX_LOGS
    assert len(left["metrics"]) <= MAX_METRICS
    assert len(left["traces"]) <= MAX_TRACES
    serialized = str(left).lower()
    assert scenario.truth.root_cause_summary.lower() not in serialized
    assert scenario.truth.failure_mechanism not in serialized


@pytest.mark.parametrize("scenario", BUILT_INS, ids=lambda item: item.public.slug)
def test_each_builtin_has_evidence_alternatives_actions_and_recovery(
    scenario: ScenarioDefinition,
) -> None:
    assert len(scenario.runtime.evidence) >= 5
    assert len(scenario.runtime.alternative_hypotheses) >= 3
    assert scenario.runtime.primary_action in scenario.runtime.allowed_actions
    state = initial_state(scenario, 77)
    for _ in range(6):
        state = advance(state)
    state = perform_action(state, scenario.runtime.primary_action)
    for _ in range(4):
        state = advance(state)
    signals = recovery_signals(state, scenario)
    assert signals["verified"] is True
    assert state["stage"] == "Completed"


@pytest.mark.parametrize("scenario", BUILT_INS, ids=lambda item: item.public.slug)
def test_each_builtin_generates_scenario_specific_report(scenario: ScenarioDefinition) -> None:
    state = initial_state(scenario, 123)
    for _ in range(6):
        state = advance(state)
    state = perform_action(state, scenario.runtime.primary_action)
    for _ in range(4):
        state = advance(state)
    state["collectedEvidence"] = [
        {
            "id": item.id,
            "source": item.source,
            "service": item.service,
            "summary": item.summary,
            "annotation": "Reviewed during the simulated investigation.",
            "hypothesisIds": [],
        }
        for item in scenario.runtime.evidence
    ]
    state["hypotheses"] = [
        {
            "id": "hyp-1",
            "title": scenario.runtime.alternative_hypotheses[0],
            "notes": "Compared with collected evidence.",
            "status": "contradicted",
            "evidenceIds": [scenario.runtime.evidence[0].id],
        }
    ]
    state["rootCauseSubmission"] = {
        "affected_service": scenario.truth.affected_service,
        "failure_mechanism": scenario.truth.failure_mechanism,
        "triggering_change": scenario.truth.triggering_change,
        "supporting_evidence": [item.id for item in scenario.runtime.evidence],
        "rejected_alternatives": list(scenario.runtime.alternative_hypotheses[:2]),
        "proposed_mitigation": scenario.truth.primary_mitigation,
        "confidence": 85,
    }
    state["recoveryVerification"] = recovery_signals(state, scenario)
    completed = complete_incident(
        state,
        scenario,
        CompletionRequest(
            incident_summary=(
                "The simulated incident was investigated, mitigated, and verified with evidence."
            ),
            customer_impact="Fictional customers experienced degraded service during the exercise.",
            lessons_learned=["Correlate multiple telemetry sources."],
            follow_up_actions=["Add a regression test for the simulated failure."],
        ),
    )
    report = completed["report"]
    assert report["scenario"]["version"] == scenario.version
    assert report["rootCause"] == scenario.truth.root_cause_summary
    assert report["betterInvestigationPath"] == list(scenario.runtime.better_path)
    assert 0 <= report["score"]["total"] <= 100
