from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Any

from app.simulation.registry import ScenarioDefinition

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


def stage_for(second: int, mitigation_at: int | None) -> str:
    if mitigation_at is not None:
        since = second - mitigation_at
        if since >= 120:
            return "Completed"
        if since >= 60:
            return "Recovery"
        return "Incident mitigation"
    if second >= 150:
        return "Checkout errors"
    if second >= 120:
        return "Order-service latency increase"
    if second >= 90:
        return "Database pool saturation"
    if second >= 60:
        return "Connection leak begins"
    if second >= 30:
        return "Deployment completed"
    return "Normal"


def _severity(stage: str) -> int:
    stages = [
        "Normal",
        "Deployment completed",
        "Connection leak begins",
        "Database pool saturation",
        "Order-service latency increase",
        "Checkout errors",
    ]
    return stages.index(stage) if stage in stages else 0


def initial_state(scenario: ScenarioDefinition, seed: int) -> dict[str, Any]:
    return {
        "scenarioId": scenario.public.id,
        "scenarioSlug": scenario.public.slug,
        "seed": seed,
        "elapsedSeconds": 0,
        "tick": 0,
        "stage": "Normal",
        "status": "ready",
        "speed": 1,
        "logs": [],
        "metrics": [_metric(seed, 0, 0, "Normal", {}, [])],
        "traces": [],
        "alerts": _alerts(),
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
) -> dict[str, Any]:
    level = _severity(stage)
    jitter = _hash(seed, tick, 99) % 23
    restart_times = [item["second"] for item in actions if item["action"] == "restart"]
    restart_relief = 120 if restart_times and second - max(restart_times) <= 60 else 0
    recovery = 0 if stage == "Completed" else 0.35 if stage == "Recovery" else 1
    pool_max = 40 + modifiers.get("poolBonus", 0)
    pool_used = min(pool_max, round((8 + level * 7) * recovery))
    return {
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


def _logs(
    seed: int, tick: int, second: int, stage: str, metric: dict[str, Any]
) -> list[dict[str, Any]]:
    level = _severity(stage)
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
            "service": "order",
            "serviceName": "order-service",
            "spanId": _hex(seed, tick, 16, 3),
            "message": message,
            "fields": {
                "service.name": "order-service",
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
            "service": "gateway",
            "serviceName": "api-gateway",
            "spanId": _hex(seed, tick, 16, 1),
            "message": "checkout response returned upstream error"
            if level >= 5
            else "checkout request routed",
            "fields": {
                "service.name": "api-gateway",
                "http.route": "/checkout",
                "sentinelops.simulated": True,
            },
        },
    ]


def _trace(seed: int, tick: int, second: int, metric: dict[str, Any]) -> dict[str, Any]:
    trace_id = _hex(seed, tick, 32, 17)
    duration = metric["orderLatencyMs"] + 46
    spans = [
        (1, None, "POST /checkout", "gateway", duration),
        (2, 1, "authorize", "auth", 24),
        (3, 1, "create order", "order", metric["orderLatencyMs"]),
        (4, 3, "acquire database connection", "orders-db", max(18, metric["orderLatencyMs"] - 95)),
        (5, 3, "INSERT orders", "orders-db", 62),
    ]
    return {
        "id": trace_id,
        "second": second,
        "timestamp": _timestamp(second),
        "rootService": "gateway",
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
                "attributes": {"sentinelops.simulated": True, "db.system": "postgresql"}
                if index >= 4
                else {"sentinelops.simulated": True},
                "critical": index in {1, 3, 4},
                "relatedLogIds": [f"log-{tick}-order"] if index in {3, 4} else [],
            }
            for index, parent, name, service, span_duration in spans
        ],
    }


def _alerts() -> list[dict[str, Any]]:
    return [
        {
            "id": "alert-db-pool",
            "title": "Orders database pool saturation",
            "severity": "warning",
            "source": "metrics",
            "service": "orders-db",
            "firstTriggered": 90,
            "lastUpdated": 90,
            "status": "firing",
            "assignedTo": None,
        },
        {
            "id": "alert-order-latency",
            "title": "Order-service latency SLO burn",
            "severity": "critical",
            "source": "metrics",
            "service": "order",
            "firstTriggered": 120,
            "lastUpdated": 120,
            "status": "firing",
            "assignedTo": None,
        },
        {
            "id": "alert-checkout-errors",
            "title": "Checkout error rate elevated",
            "severity": "critical",
            "source": "logs",
            "service": "gateway",
            "firstTriggered": 150,
            "lastUpdated": 150,
            "status": "firing",
            "assignedTo": None,
        },
    ]


def advance(state: dict[str, Any]) -> dict[str, Any]:
    if state["status"] == "completed":
        return deepcopy(state)
    result = deepcopy(state)
    result["elapsedSeconds"] += INTERVAL_SECONDS
    result["tick"] += 1
    previous_stage = result["stage"]
    result["stage"] = stage_for(result["elapsedSeconds"], result["mitigationAt"])
    if result["stage"] == "Completed":
        result["status"] = "completed"
    metric = _metric(
        result["seed"],
        result["tick"],
        result["elapsedSeconds"],
        result["stage"],
        result["modifiers"],
        result["actions"],
    )
    logs = _logs(result["seed"], result["tick"], result["elapsedSeconds"], result["stage"], metric)
    result["metrics"] = (result["metrics"] + [metric])[-MAX_METRICS:]
    result["logs"] = (result["logs"] + logs)[-MAX_LOGS:]
    result["traces"] = (
        result["traces"]
        + [_trace(result["seed"], result["tick"], result["elapsedSeconds"], metric)]
    )[-MAX_TRACES:]
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
    if len(result["actions"]) >= MAX_ACTIONS:
        raise ValueError("Action limit reached.")
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
    elif action == "rollback":
        if result["mitigationAt"] is not None:
            raise ValueError("Rollback has already been applied.")
        result["mitigationAt"] = result["elapsedSeconds"]
        result["stage"] = "Incident mitigation"
        effect = "Rollback initiated; the simulation enters mitigation and recovery can begin."
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
