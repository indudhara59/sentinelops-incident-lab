from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Any

from app.simulation.registry import MIDNIGHT_LATENCY, ScenarioDefinition, get_scenario

INTERVAL_SECONDS = 30
MAX_LOGS = 100
MAX_METRICS = 120
MAX_TRACES = 60
MAX_EVENTS = 160
MAX_ACTIONS = 100
ENGINE_VERSION = "sentinelops-engine@1.0.0"


def _hash(seed: int, tick: int, salt: int) -> int:
    value = (seed ^ ((tick + 1) * 0x9E3779B1) ^ salt) & 0xFFFFFFFF
    value ^= (value << 13) & 0xFFFFFFFF
    value ^= value >> 17
    value ^= (value << 5) & 0xFFFFFFFF
    return value & 0xFFFFFFFF


def _hex(seed: int, tick: int, length: int, salt: int) -> str:
    parts: list[str] = []
    index = 0
    while len("".join(parts)) < length:
        parts.append(f"{_hash(seed, tick + index, salt + index):08x}")
        index += 1
    return "".join(parts)[:length]


def _timestamp(second: int) -> str:
    return (datetime(2026, 1, 15, 0, 0, tzinfo=UTC) + timedelta(seconds=second)).isoformat()


def stage_for(
    second: int, mitigation_at: int | None, scenario: ScenarioDefinition = MIDNIGHT_LATENCY
) -> str:
    if mitigation_at is not None:
        since = second - mitigation_at
        if since >= 120:
            return "Completed"
        if since >= 60:
            return "Recovery"
        return "Incident mitigation"
    return next(name for at, name in reversed(scenario.stages) if second >= at)


def _severity(stage: str, scenario: ScenarioDefinition = MIDNIGHT_LATENCY) -> int:
    stages = [name for _, name in scenario.stages]
    return stages.index(stage) if stage in stages else 0


def initial_state(scenario: ScenarioDefinition, seed: int) -> dict[str, Any]:
    return {
        "scenarioId": scenario.public.id,
        "scenarioSlug": scenario.public.slug,
        "scenarioTitle": scenario.public.title,
        "difficulty": scenario.public.difficulty,
        "scenarioVersion": scenario.version,
        "engineVersion": ENGINE_VERSION,
        "seed": seed,
        "elapsedSeconds": 0,
        "tick": 0,
        "stage": "Normal",
        "status": "ready",
        "speed": 1,
        "logs": [],
        "metrics": [_metric(seed, 0, 0, "Normal", {}, [], scenario)],
        "traces": [],
        "alerts": _alerts(scenario),
        "services": _services(scenario, 0, "Normal", seed, 0),
        "evidenceCatalog": [
            {
                "id": item.id,
                "source": item.source,
                "availableAt": item.available_at,
                "timestamp": _timestamp(item.available_at),
                "service": item.service,
                "summary": item.summary,
                "fields": dict(item.fields),
            }
            for item in scenario.runtime.evidence
        ],
        "alternativeHypotheses": list(scenario.runtime.alternative_hypotheses),
        "allowedActions": list(scenario.runtime.allowed_actions),
        "timeline": [
            {
                "id": "timeline-start",
                "second": 0,
                "kind": "system",
                "title": "Incident simulation started",
                "description": "Traffic and service health are within normal bounds.",
            }
        ],
        "collectedEvidence": [],
        "hypotheses": [],
        "actions": [],
        "rootCauseSubmission": None,
        "recoveryVerification": None,
        "completionDocumentation": None,
        "report": None,
        "investigationCompleted": False,
        "mitigationAt": None,
        "modifiers": {"poolBonus": 0, "latencyReduction": 0, "errorReduction": 0},
    }


def _metric(
    seed: int,
    tick: int,
    second: int,
    stage: str,
    modifiers: dict[str, int],
    actions: list[dict[str, Any]],
    scenario: ScenarioDefinition = MIDNIGHT_LATENCY,
) -> dict[str, Any]:
    level = _severity(stage, scenario)
    jitter = _hash(seed, tick, 99) % 23
    restart_times = [item["second"] for item in actions if item["action"] == "restart"]
    restart_relief = 120 if restart_times and second - max(restart_times) <= 60 else 0
    recovery = 0 if stage == "Completed" else 0.35 if stage == "Recovery" else 1
    pool_max = 40 + modifiers.get("poolBonus", 0)
    pool_used = min(pool_max, round((8 + level * 7) * recovery))
    metric = {
        "second": second,
        "requestRate": 780 + jitter,
        "orderLatencyMs": max(
            80,
            round(
                (95 + level * 480 - modifiers.get("latencyReduction", 0) - restart_relief)
                * recovery
                + jitter
            ),
        ),
        "latencyP50Ms": max(45, round((70 + level * 85) * recovery + jitter / 2)),
        "latencyP99Ms": max(110, round((130 + level * 620) * recovery + jitter)),
        "checkoutErrorRate": round(
            max(0.1, (12.8 if level >= 5 else 2.2 if level >= 4 else 0.2) * recovery), 1
        ),
        "cpuPercent": round(min(92, 31 + level * 7 + jitter / 5), 1),
        "memoryMb": 420 + level * 18 + jitter,
        "dbPoolUsed": pool_used,
        "dbPoolMax": pool_max,
        "dbPoolUtilizationPercent": round(pool_used / pool_max * 100),
        "queueDepth": max(2, 12 + level * 2),
        "serviceRestarts": sum(item["action"] == "restart" for item in actions),
    }
    kind = scenario.runtime.kind
    if kind == "queue":
        metric["queueDepth"] = max(8, round((15 + level * 85 + tick * level * 6) * recovery))
        metric["orderLatencyMs"] = max(90, round((120 + level * 310) * recovery + jitter))
        metric["requestRate"] = 420 + level * 190 + jitter
        metric["checkoutErrorRate"] = round(max(0.1, level * 1.8 * recovery), 1)
    elif kind == "memory":
        metric["memoryMb"] = max(380, round((410 + level * 170 + tick * level * 18) * recovery))
        metric["serviceRestarts"] = max(metric["serviceRestarts"], max(0, level - 3))
        metric["queueDepth"] = 10 + level * 24
        metric["checkoutErrorRate"] = round(max(0.1, (level - 3) * 4.4 * recovery), 1)
    elif kind == "auth":
        metric["requestRate"] = round((650 + level * 780 + jitter) * recovery)
        metric["checkoutErrorRate"] = round(max(0.1, level * 2.4 * recovery), 1)
        metric["orderLatencyMs"] = max(80, round((100 + level * 390) * recovery + jitter))
        metric["dbPoolUtilizationPercent"] = min(96, 25 + level * 11)
    elif kind == "cascade":
        metric["requestRate"] = round((720 + level * 360 + jitter) * recovery)
        metric["orderLatencyMs"] = max(90, round((130 + level * 520) * recovery + jitter))
        metric["checkoutErrorRate"] = round(max(0.1, level * 2.7 * recovery), 1)
        metric["dbPoolUtilizationPercent"] = min(98, 30 + level * 12)
    return metric


def _scenario_for(state: dict[str, Any]) -> ScenarioDefinition:
    return get_scenario(state.get("scenarioSlug", "")) or MIDNIGHT_LATENCY


def _services(
    scenario: ScenarioDefinition, second: int, stage: str, seed: int, tick: int
) -> list[dict[str, Any]]:
    level = _severity(stage, scenario)
    recovering = stage in {"Incident mitigation", "Recovery"}
    return [
        {
            "id": item.id,
            "name": item.name,
            "type": item.type,
            "dependencies": list(item.dependencies),
            "health": "recovering"
            if recovering and item.id in scenario.runtime.affected_services
            else "critical"
            if level >= 5 and item.id in scenario.runtime.affected_services
            else "degraded"
            if level >= 2 and item.id in scenario.runtime.affected_services
            else "healthy",
            "requestsPerMinute": 300 + (_hash(seed, tick, index + 20) % 600),
            "errorRate": round(level * 1.8, 1)
            if item.id in scenario.runtime.affected_services
            else 0.2,
            "latencyMs": 75 + level * 360 if item.id in scenario.runtime.affected_services else 55,
        }
        for index, item in enumerate(scenario.runtime.services)
    ]


def _logs(
    seed: int,
    tick: int,
    second: int,
    stage: str,
    metric: dict[str, Any],
    scenario: ScenarioDefinition = MIDNIGHT_LATENCY,
) -> list[dict[str, Any]]:
    level = _severity(stage, scenario)
    primary_message, upstream_message = {
        "latency": (
            "database connection acquisition timed out",
            "checkout response returned upstream error",
        ),
        "queue": (
            "delivery retry scheduled after consumer timeout",
            "notification backlog delay increasing",
        ),
        "memory": (
            "worker memory limit approached after image completion",
            "image processing failed after worker restart",
        ),
        "auth": (
            "simulated failed sign-in rejected by defensive controls",
            "legitimate sign-in delayed by limiter pressure",
        ),
        "cascade": (
            "payment timeout triggered bounded checkout retry",
            "checkout failed after upstream timeout",
        ),
    }[scenario.runtime.kind]
    severity, message = (
        ("ERROR", "database connection acquisition timed out")
        if level >= 4
        else ("WARN", "database pool utilization above threshold")
        if level >= 3
        else ("WARN", "connection checkout duration increasing")
        if level >= 2
        else ("INFO", "order-service deployment healthy")
        if level == 1
        else ("INFO", "request completed")
    )
    trace_id = _hex(seed, tick, 32, 17)
    request_id = f"req_sim_{_hex(seed, tick, 12, 8)}"
    base = {
        "second": second,
        "timestamp": _timestamp(second),
        "traceId": trace_id,
        "deploymentVersion": "2.14.7" if level >= 1 else "2.14.6",
        "requestId": request_id,
    }
    return [
        {
            **base,
            "id": f"log-{tick}-order",
            "level": severity,
            "service": scenario.runtime.affected_services[0],
            "serviceName": scenario.runtime.affected_services[0],
            "spanId": _hex(seed, tick, 16, 3),
            "message": primary_message if level >= 2 else message,
            "fields": {
                "service.name": scenario.runtime.affected_services[0],
                "deployment.version": base["deploymentVersion"],
                "request_id": request_id,
                "duration_ms": metric["orderLatencyMs"],
                "sentinelops.simulated": True,
            },
        },
        {
            **base,
            "id": f"log-{tick}-gateway",
            "level": "ERROR" if level >= 5 else "INFO",
            "service": scenario.runtime.affected_services[-1],
            "serviceName": scenario.runtime.affected_services[-1],
            "spanId": _hex(seed, tick, 16, 1),
            "message": upstream_message if level >= 5 else "simulated request routed",
            "fields": {
                "service.name": scenario.runtime.affected_services[-1],
                "operation": "simulated-request",
                "sentinelops.simulated": True,
            },
        },
    ]


def _trace(
    seed: int,
    tick: int,
    second: int,
    metric: dict[str, Any],
    scenario: ScenarioDefinition = MIDNIGHT_LATENCY,
) -> dict[str, Any]:
    trace_id = _hex(seed, tick, 32, 17)
    duration = metric["orderLatencyMs"] + 46
    services = scenario.runtime.services
    root = services[0].id
    affected = scenario.runtime.affected_services[0]
    operation = {
        "latency": "acquire database connection",
        "queue": "wait for consumer capacity",
        "memory": "decode image buffer",
        "auth": "evaluate defensive rate limit",
        "cascade": "wait for payment response",
    }[scenario.runtime.kind]
    spans = [
        (1, None, "handle simulated request", root, duration),
        (2, 1, "route request", services[min(1, len(services) - 1)].id, 24),
        (3, 1, "process operation", affected, metric["orderLatencyMs"]),
        (4, 3, operation, services[-1].id, max(18, metric["orderLatencyMs"] - 95)),
    ]
    return {
        "id": trace_id,
        "second": second,
        "timestamp": _timestamp(second),
        "rootService": root,
        "durationMs": duration,
        "status": "ERROR" if metric["checkoutErrorRate"] >= 5 else "OK",
        "spans": [
            {
                "id": _hex(seed, tick, 16, index),
                "parentId": _hex(seed, tick, 16, parent) if parent else None,
                "name": name,
                "service": service,
                "startMs": index * 4,
                "durationMs": span_duration,
                "status": "ERROR" if index == 4 and metric["checkoutErrorRate"] >= 5 else "OK",
                "attributes": {
                    "sentinelops.simulated": True,
                    "scenario.kind": scenario.runtime.kind,
                },
                "critical": index in {1, 3, 4},
                "relatedLogIds": [f"log-{tick}-order"] if index in {3, 4} else [],
            }
            for index, parent, name, service, span_duration in spans
        ],
    }


def _alerts(scenario: ScenarioDefinition = MIDNIGHT_LATENCY) -> list[dict[str, Any]]:
    return [
        {
            "id": item.id,
            "title": item.title,
            "severity": item.severity,
            "source": item.source,
            "service": item.service,
            "firstTriggered": item.first_triggered,
            "lastUpdated": item.first_triggered,
            "status": "firing",
            "assignedTo": None,
            "metric": item.metric,
        }
        for item in scenario.runtime.alerts
    ]


def advance(state: dict[str, Any]) -> dict[str, Any]:
    if state["status"] == "completed":
        return deepcopy(state)
    result = deepcopy(state)
    scenario = _scenario_for(result)
    result["elapsedSeconds"] += INTERVAL_SECONDS
    result["tick"] += 1
    previous_stage = result["stage"]
    result["stage"] = stage_for(result["elapsedSeconds"], result["mitigationAt"], scenario)
    if result["stage"] == "Completed":
        result["status"] = "completed"
    metric = _metric(
        result["seed"],
        result["tick"],
        result["elapsedSeconds"],
        result["stage"],
        result["modifiers"],
        result["actions"],
        scenario,
    )
    logs = _logs(
        result["seed"], result["tick"], result["elapsedSeconds"], result["stage"], metric, scenario
    )
    result["metrics"] = (result["metrics"] + [metric])[-MAX_METRICS:]
    result["logs"] = (result["logs"] + logs)[-MAX_LOGS:]
    result["traces"] = (
        result["traces"]
        + [_trace(result["seed"], result["tick"], result["elapsedSeconds"], metric, scenario)]
    )[-MAX_TRACES:]
    result["services"] = _services(
        scenario, result["elapsedSeconds"], result["stage"], result["seed"], result["tick"]
    )
    for alert in result["alerts"]:
        if alert["firstTriggered"] <= result["elapsedSeconds"]:
            alert["lastUpdated"] = result["elapsedSeconds"]
    if result["stage"] != previous_stage:
        result["timeline"].append(
            {
                "id": f"timeline-{result['tick']}-{result['stage']}",
                "second": result["elapsedSeconds"],
                "kind": "recovery" if result["stage"] in {"Recovery", "Completed"} else "alert",
                "title": result["stage"],
                "description": "Deterministic simulated incident state updated.",
            }
        )
        result["timeline"] = result["timeline"][-MAX_EVENTS:]
    return result


def perform_action(
    state: dict[str, Any], action: str, target_id: str | None = None
) -> dict[str, Any]:
    result = deepcopy(state)
    scenario = _scenario_for(result)
    if len(result["actions"]) >= MAX_ACTIONS:
        raise ValueError("Action limit reached.")
    if action not in scenario.runtime.allowed_actions and action not in {
        "ack-alert",
        "assign-alert",
        "silence-alert",
    }:
        raise ValueError("Action is not allowlisted for this scenario.")
    labels = {
        "restart": "Restart service",
        "scale": "Scale service",
        "rollback": "Roll back deployment",
        "increase-pool": "Increase database pool temporarily",
        "disable-retry": "Disable retry behavior",
        "pause-consumer": "Pause message consumer",
        "observe": "Do nothing and observe",
        "ack-alert": "Acknowledge alert",
        "assign-alert": "Assign alert to self",
        "silence-alert": "Silence alert in simulation",
    }
    effect = "Observation interval recorded; simulation state continues unchanged."
    if action in {"ack-alert", "assign-alert", "silence-alert"}:
        alert = next((item for item in result["alerts"] if item["id"] == target_id), None)
        if alert is None or alert["firstTriggered"] > result["elapsedSeconds"]:
            raise ValueError("Alert is not active.")
        if action == "ack-alert":
            alert["status"] = "acknowledged"
            effect = "Alert acknowledged; underlying telemetry remains active."
        elif action == "assign-alert":
            alert["assignedTo"] = "self"
            effect = "Alert assigned locally to the player."
        else:
            alert["status"] = "silenced"
            effect = "Alert notifications silenced; evidence and telemetry are retained."
    elif action == scenario.runtime.primary_action:
        if result["mitigationAt"] is not None:
            raise ValueError("Rollback has already been applied.")
        result["mitigationAt"] = result["elapsedSeconds"]
        result["stage"] = "Incident mitigation"
        effect = (
            "Rollback initiated; recovery can begin."
            if action == "rollback"
            else "Primary mitigation initiated; recovery can begin."
        )
    elif action == "increase-pool":
        result["modifiers"]["poolBonus"] += 10
        result["modifiers"]["latencyReduction"] += 300
        effect = "Pool ceiling increases temporarily, reducing simulated wait pressure."
    elif action == "scale":
        result["modifiers"]["latencyReduction"] += 180
        effect = "Additional order-service capacity temporarily lowers latency."
    elif action == "restart":
        effect = "An order-service instance restarts; symptoms ease briefly."
    elif action == "disable-retry":
        result["modifiers"]["errorReduction"] += 2
        effect = "Retry amplification falls, reducing simulated error pressure."
    entry = {
        "id": f"action-{result['tick']}-{len(result['actions']) + 1}",
        "action": action,
        "targetId": target_id,
        "label": labels[action],
        "second": result["elapsedSeconds"],
        "risk": "Safe simulated action; no real command is executed.",
        "effect": effect,
    }
    result["actions"].append(entry)
    result["timeline"] = (
        result["timeline"]
        + [
            {
                "id": f"timeline-{entry['id']}",
                "second": result["elapsedSeconds"],
                "kind": "action",
                "title": labels[action],
                "description": effect,
            }
        ]
    )[-MAX_EVENTS:]
    return result
