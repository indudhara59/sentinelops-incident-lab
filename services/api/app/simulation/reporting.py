from __future__ import annotations

import csv
import io
import re
from copy import deepcopy
from typing import Any

from app.simulation.engine import ENGINE_VERSION
from app.simulation.models import (
    CompletionRequest,
    RecoveryVerificationRequest,
    RootCauseSubmission,
)
from app.simulation.registry import ScenarioDefinition

CATEGORY_MAX = 10
SCORE_CATEGORIES = (
    "Impact assessment",
    "Telemetry investigation",
    "Evidence quality",
    "Hypothesis quality",
    "Root-cause identification",
    "Mitigation selection",
    "Recovery verification",
    "Incident documentation",
    "Operational safety",
    "Efficiency",
)


def record_root_cause(state: dict[str, Any], submission: RootCauseSubmission) -> dict[str, Any]:
    known = {item["id"] for item in state["collectedEvidence"]}
    linked = set(submission.supporting_evidence)
    if not linked.issubset(known):
        raise ValueError("Root-cause submission refers to evidence that was not collected.")
    sources = {item["source"] for item in state["collectedEvidence"] if item["id"] in linked}
    if len(sources) < 2:
        raise ValueError("Supporting evidence must link at least two telemetry sources.")
    result = deepcopy(state)
    result["rootCauseSubmission"] = submission.model_dump(mode="json")
    return result


def recovery_signals(
    state: dict[str, Any], scenario: ScenarioDefinition | None = None
) -> dict[str, Any]:
    mitigation_at = state["mitigationAt"]
    post_mitigation = [
        point
        for point in state["metrics"]
        if mitigation_at is not None and point["second"] > mitigation_at
    ]
    stable = post_mitigation[-3:]
    successful_traces = [
        trace
        for trace in state["traces"]
        if mitigation_at is not None and trace["second"] > mitigation_at and trace["status"] == "OK"
    ]
    definition = scenario
    if definition is None:
        from app.simulation.registry import get_scenario

        definition = get_scenario(state.get("scenarioSlug", ""))
    thresholds = (
        definition.runtime.recovery_thresholds
        if definition
        else (
            ("orderLatencyMs", "lt", 500),
            ("checkoutErrorRate", "lt", 1),
            ("dbPoolUtilizationPercent", "lt", 70),
        )
    )
    checks = {
        f"normalized_{metric}": bool(stable)
        and all(
            point[metric] < target if operator == "lt" else point[metric] > target
            for point in stable
        )
        for metric, operator, target in thresholds
    }
    checks.update(
        {
            "successfulCheckoutTraces": bool(successful_traces),
            "stableObservationWindow": len(stable) >= 3,
        }
    )
    return {
        "checks": checks,
        "verified": all(checks.values()),
        "sampleCount": len(stable),
        "windowStart": stable[0]["second"] if stable else None,
        "windowEnd": stable[-1]["second"] if stable else None,
    }


def verify_recovery(state: dict[str, Any], request: RecoveryVerificationRequest) -> dict[str, Any]:
    known = {item["id"] for item in state["collectedEvidence"]}
    if not set(request.evidence_ids).issubset(known):
        raise ValueError("Recovery verification refers to evidence that was not collected.")
    signals = recovery_signals(state)
    if not signals["verified"]:
        raise ValueError("Recovery is not yet stable across all required signals.")
    result = deepcopy(state)
    result["recoveryVerification"] = {
        **signals,
        "evidenceIds": request.evidence_ids,
        "observation": request.observation,
    }
    return result


def _score(state: dict[str, Any], scenario: ScenarioDefinition) -> list[dict[str, Any]]:
    evidence = state["collectedEvidence"]
    sources = {item["source"] for item in evidence}
    submission = state["rootCauseSubmission"]
    actions = [item["action"] for item in state["actions"]]
    hypotheses = state["hypotheses"]
    truth = scenario.truth
    linked = set(submission["supporting_evidence"])
    linked_sources = {item["source"] for item in evidence if item["id"] in linked}

    values: dict[str, tuple[int, str]] = {}
    alert_evidence = [item for item in evidence if item["source"] == "Alerts"]
    impact = min(
        10,
        (4 if alert_evidence else 0)
        + (3 if any(item.get("annotation") for item in alert_evidence) else 0)
        + (3 if state["completionDocumentation"]["customer_impact"] else 0),
    )
    values["Impact assessment"] = (
        impact,
        "Impact signals and customer-facing consequences were documented.",
    )
    telemetry = min(10, len(sources & {"Logs", "Metrics", "Traces", "Deployments", "Alerts"}) * 2)
    values["Telemetry investigation"] = (
        telemetry,
        f"Investigated {len(sources)} distinct evidence sources.",
    )
    evidence_quality = min(10, len(linked) + len(linked_sources) * 2)
    values["Evidence quality"] = (
        evidence_quality,
        "Linked evidence breadth and source diversity were assessed.",
    )
    supported = sum(
        1 for item in hypotheses if item["status"] == "supported" and item["evidenceIds"]
    )
    hypothesis_quality = min(
        10, len(hypotheses) * 2 + supported * 3 + min(3, len(submission["rejected_alternatives"]))
    )
    values["Hypothesis quality"] = (
        hypothesis_quality,
        "Reasonable alternatives are not penalized; support and explicit rejection earn credit.",
    )
    truth_matches = sum(
        (
            submission["affected_service"] == truth.affected_service,
            submission["failure_mechanism"] == truth.failure_mechanism,
            submission["triggering_change"] == truth.triggering_change,
        )
    )
    root_score = (
        truth_matches * 2
        + (2 if truth.required_evidence_sources.issubset(linked_sources) else 0)
        + (2 if submission["confidence"] >= 50 else 1)
    )
    values["Root-cause identification"] = (
        min(10, root_score),
        "The structured conclusion was compared with the hidden truth and its evidence support.",
    )
    mitigation = (
        10
        if scenario.runtime.primary_action in actions
        and submission["proposed_mitigation"] == truth.primary_mitigation
        else 5
        if set(actions) & set(scenario.runtime.temporary_actions)
        else 3
        if set(actions) & set(scenario.runtime.risky_actions)
        else 0
    )
    values["Mitigation selection"] = (
        mitigation,
        "The scenario's primary mitigation earns full credit; temporary relief "
        "earns partial credit.",
    )
    recovery = 10 if state["recoveryVerification"]["verified"] else 0
    values["Recovery verification"] = (
        recovery,
        "All five recovery signals require a stable observation window.",
    )
    documentation = min(
        10,
        4
        + len(state["completionDocumentation"]["lessons_learned"])
        + len(state["completionDocumentation"]["follow_up_actions"])
        + (2 if submission["rejected_alternatives"] else 0),
    )
    values["Incident documentation"] = (
        documentation,
        "Summary, lessons, follow-ups, and rejected alternatives were recorded.",
    )
    risky = sum(actions.count(action) * 2 for action in scenario.runtime.risky_actions)
    risky += sum(max(0, actions.count(action) - 1) for action in scenario.runtime.temporary_actions)
    safety = max(0, 10 - risky)
    values["Operational safety"] = (
        safety,
        "Risk-aware actions are rewarded; repeated or database-risk-increasing "
        "actions reduce this category.",
    )
    avoidable = max(0, len(actions) - 8) + max(0, actions.count("observe") - 2)
    efficiency = max(0, 10 - avoidable)
    values["Efficiency"] = (
        efficiency,
        "Reasonable exploration is unpenalized; only excessive repeated actions reduce efficiency.",
    )
    return [
        {
            "category": category,
            "score": values[category][0],
            "maximum": CATEGORY_MAX,
            "explanation": values[category][1],
        }
        for category in SCORE_CATEGORIES
    ]


def complete_incident(
    state: dict[str, Any], scenario: ScenarioDefinition, documentation: CompletionRequest
) -> dict[str, Any]:
    if state["rootCauseSubmission"] is None:
        raise ValueError("Submit an evidence-linked root-cause analysis before completion.")
    if state["recoveryVerification"] is None or not state["recoveryVerification"]["verified"]:
        raise ValueError("Verify stable recovery before completion.")
    result = deepcopy(state)
    result["completionDocumentation"] = documentation.model_dump(mode="json")
    breakdown = _score(result, scenario)
    total = sum(item["score"] for item in breakdown)
    collected_sources = {item["source"] for item in result["collectedEvidence"]}
    missed = sorted(scenario.truth.required_evidence_sources - collected_sources)
    result["report"] = {
        "schemaVersion": "sentinelops-report@1.0.0",
        "sessionId": result.get("sessionId"),
        "scenario": {
            "id": scenario.public.id,
            "slug": scenario.public.slug,
            "title": scenario.public.title,
            "version": scenario.version,
        },
        "engineVersion": ENGINE_VERSION,
        "seed": result["seed"],
        "executiveSummary": documentation.incident_summary,
        "customerImpact": documentation.customer_impact,
        "timeline": result["timeline"],
        "alerts": result["alerts"],
        "evidence": result["collectedEvidence"],
        "hypotheses": result["hypotheses"],
        "rootCause": scenario.truth.root_cause_summary,
        "rootCauseSubmission": result["rootCauseSubmission"],
        "contributingFactors": list(scenario.truth.contributing_factors),
        "actions": result["actions"],
        "recoveryVerification": result["recoveryVerification"],
        "score": {"total": total, "maximum": 100, "breakdown": breakdown},
        "missedEvidence": missed,
        "betterInvestigationPath": list(scenario.runtime.better_path),
        "lessonsLearned": documentation.lessons_learned,
        "followUpActions": documentation.follow_up_actions,
        "replay": {
            "scenarioVersion": scenario.version,
            "engineVersion": ENGINE_VERSION,
            "seed": result["seed"],
            "actions": [
                {
                    "action": item["action"],
                    "second": item["second"],
                    "targetId": item.get("targetId"),
                }
                for item in result["actions"]
            ],
        },
        "disclaimer": (
            "Educational simulated incident report. Not an official SRE certification "
            "or employment assessment."
        ),
    }
    result["investigationCompleted"] = True
    return result


def safe_filename(session_id: str, suffix: str) -> str:
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", session_id)[:64]
    return f"sentinelops-{safe_id}-{suffix}"


def safe_csv_cell(value: Any) -> str:
    text = str(value)
    return f"'{text}" if text.startswith(("=", "+", "-", "@")) else text


def timeline_csv(report: dict[str, Any]) -> str:
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["second", "kind", "title", "description"])
    for item in report["timeline"]:
        writer.writerow(
            [safe_csv_cell(item.get(key, "")) for key in ("second", "kind", "title", "description")]
        )
    return output.getvalue()
