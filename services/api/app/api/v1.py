import asyncio
import re
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.simulation.engine import advance
from app.simulation.models import (
    ActionRequest,
    CompletionRequest,
    CreateSessionRequest,
    EvidenceRequest,
    HypothesisPatch,
    HypothesisRequest,
    RecoveryVerificationRequest,
    RootCauseSubmission,
    ScenarioSummary,
    SessionResponse,
)
from app.simulation.registry import get_scenario, list_scenarios
from app.simulation.reporting import (
    complete_incident,
    record_root_cause,
    safe_filename,
    timeline_csv,
    verify_recovery,
)
from app.simulation.store import Session, StoreError, action_callback, store

router = APIRouter(prefix="/api/v1", tags=["status"])


class StatusResponse(BaseModel):
    service: str
    version: str
    status: str
    environment: str


@router.get("/status", response_model=StatusResponse)
async def status(settings: Annotated[Settings, Depends(get_settings)]) -> StatusResponse:
    return StatusResponse(
        service=settings.app_name,
        version=settings.app_version,
        status="operational",
        environment=settings.environment,
    )


@router.get("/scenarios", response_model=list[ScenarioSummary], tags=["scenarios"])
async def scenarios() -> list[ScenarioSummary]:
    return list_scenarios()


@router.get("/scenarios/{slug}", response_model=ScenarioSummary, tags=["scenarios"])
async def scenario(slug: str) -> ScenarioSummary:
    definition = get_scenario(slug)
    if definition is None:
        raise StoreError(
            "SCENARIO_NOT_FOUND", "The scenario is not in the allowlisted registry.", 404
        )
    return definition.public


def _session_response(session: Session) -> SessionResponse:
    return SessionResponse(
        id=session.id,
        scenario_slug=session.scenario.public.slug,
        seed=session.seed,
        version=session.version,
        expires_at=session.snapshot()["expiresAt"],
        snapshot=session.snapshot(),
    )


@router.post("/sessions", response_model=SessionResponse, status_code=201, tags=["sessions"])
async def create_session(body: CreateSessionRequest) -> SessionResponse:
    definition = get_scenario(body.scenario_slug)
    if definition is None or definition.public.implementation_status != "ready":
        raise StoreError(
            "INVALID_SCENARIO", "The scenario cannot create a simulation session.", 404
        )
    session = await store.create(definition, body.seed)
    await store.start_runner(session)
    return _session_response(session)


@router.get("/sessions/{session_id}", response_model=SessionResponse, tags=["sessions"])
async def get_session(session_id: str) -> SessionResponse:
    return _session_response(await store.get(session_id))


async def _state_change(
    session_id: str,
    operation: str,
    callback: Any,
    idempotency_key: str | None,
    event_type: str = "state.updated",
) -> dict[str, Any]:
    session = await store.get(session_id)
    return await store.mutate(
        session,
        idempotency_key=idempotency_key,
        operation=operation,
        callback=callback,
        event_type=event_type,
    )


def _status_transition(required: set[str], target: str) -> Any:
    def transition(state: dict[str, Any]) -> dict[str, Any]:
        if state["status"] not in required:
            raise ValueError(f"Cannot transition from {state['status']} to {target}.")
        return {**state, "status": target}

    return transition


@router.post("/sessions/{session_id}/pause", tags=["sessions"])
async def pause_session(
    session_id: str,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    return await _state_change(
        session_id, "pause", _status_transition({"running"}, "paused"), idempotency_key
    )


@router.post("/sessions/{session_id}/resume", tags=["sessions"])
async def resume_session(
    session_id: str,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    return await _state_change(
        session_id, "resume", _status_transition({"ready", "paused"}, "running"), idempotency_key
    )


@router.post("/sessions/{session_id}/step", tags=["sessions"])
async def step_session(
    session_id: str,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    def step(state: dict[str, Any]) -> dict[str, Any]:
        if state["status"] == "running":
            raise ValueError("Pause the simulation before stepping.")
        return advance(state)

    return await _state_change(session_id, "step", step, idempotency_key)


@router.post("/sessions/{session_id}/actions", tags=["sessions"])
async def session_action(
    session_id: str,
    body: ActionRequest,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    return await _state_change(
        session_id,
        "action",
        action_callback(body.action, body.target_id),
        idempotency_key,
        "action.result",
    )


@router.post("/sessions/{session_id}/evidence", tags=["sessions"])
async def collect_evidence(
    session_id: str,
    body: EvidenceRequest,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    def collect(state: dict[str, Any]) -> dict[str, Any]:
        if any(item["id"] == body.id for item in state["collectedEvidence"]):
            return state
        if len(state["collectedEvidence"]) >= 100:
            raise ValueError("Evidence limit reached.")
        catalog_item = next(
            (item for item in state.get("evidenceCatalog", []) if item["id"] == body.id), None
        )
        if catalog_item is None:
            source_prefix = {
                "Logs": "ev-logs-",
                "Metrics": "ev-metrics-",
                "Traces": "ev-traces-",
                "Deployments": "ev-deployments-",
                "Alerts": "ev-alerts-",
            }[body.source]
            timestamp = re.fullmatch(r"T\+(\d{1,5})s", body.timestamp)
            service_ids = {item["id"] for item in state.get("services", [])}
            if (
                not body.id.startswith(source_prefix)
                or timestamp is None
                or int(timestamp.group(1)) > state["elapsedSeconds"]
                or body.service not in service_ids
            ):
                raise ValueError("Evidence is unknown or not yet available.")
            catalog_item = {**body.model_dump(), "availableAt": int(timestamp.group(1))}
        elif catalog_item["availableAt"] > state["elapsedSeconds"]:
            raise ValueError("Evidence is unknown or not yet available.")
        result = {
            **state,
            "collectedEvidence": [
                *state["collectedEvidence"],
                {**catalog_item, "annotation": body.annotation, "hypothesisIds": []},
            ],
        }
        return result

    return await _state_change(session_id, "evidence", collect, idempotency_key)


@router.post("/sessions/{session_id}/hypotheses", tags=["sessions"])
async def create_hypothesis(
    session_id: str,
    body: HypothesisRequest,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    def create(state: dict[str, Any]) -> dict[str, Any]:
        if len(state["hypotheses"]) >= 50:
            raise ValueError("Hypothesis limit reached.")
        item = {
            "id": f"hyp-{len(state['hypotheses']) + 1}",
            **body.model_dump(),
            "status": "unresolved",
            "evidenceIds": [],
        }
        return {**state, "hypotheses": [*state["hypotheses"], item]}

    return await _state_change(session_id, "hypothesis-create", create, idempotency_key)


@router.patch("/sessions/{session_id}/hypotheses/{hypothesis_id}", tags=["sessions"])
async def patch_hypothesis(
    session_id: str,
    hypothesis_id: str,
    body: HypothesisPatch,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    def patch(state: dict[str, Any]) -> dict[str, Any]:
        if not any(item["id"] == hypothesis_id for item in state["hypotheses"]):
            raise ValueError("Hypothesis was not found.")
        update = body.model_dump(exclude_none=True)
        if "evidence_ids" in update:
            known = {item["id"] for item in state["collectedEvidence"]}
            if not set(update["evidence_ids"]).issubset(known):
                raise ValueError("Hypothesis refers to unknown evidence.")
            update["evidenceIds"] = update.pop("evidence_ids")
        return {
            **state,
            "hypotheses": [
                {**item, **update} if item["id"] == hypothesis_id else item
                for item in state["hypotheses"]
            ],
        }

    return await _state_change(
        session_id, f"hypothesis-patch:{hypothesis_id}", patch, idempotency_key
    )


@router.post("/sessions/{session_id}/root-cause", tags=["completion"])
async def submit_root_cause(
    session_id: str,
    body: RootCauseSubmission,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    session = await store.get(session_id)
    runtime = session.scenario.runtime
    if (
        body.affected_service not in runtime.conclusion_services
        or body.failure_mechanism not in runtime.conclusion_mechanisms
        or body.triggering_change not in runtime.conclusion_triggers
        or body.proposed_mitigation not in runtime.conclusion_mitigations
    ):
        raise StoreError("INVALID_CONCLUSION", "Conclusion value is not allowlisted.", 422)
    return await _state_change(
        session_id,
        "root-cause",
        lambda state: record_root_cause(state, body),
        idempotency_key,
    )


@router.post("/sessions/{session_id}/recovery/verify", tags=["completion"])
async def submit_recovery_verification(
    session_id: str,
    body: RecoveryVerificationRequest,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    return await _state_change(
        session_id,
        "recovery-verification",
        lambda state: verify_recovery(state, body),
        idempotency_key,
    )


@router.post("/sessions/{session_id}/complete", tags=["completion"])
async def complete_session(
    session_id: str,
    body: CompletionRequest,
    idempotency_key: Annotated[str | None, Header(max_length=128)] = None,
) -> dict[str, Any]:
    session = await store.get(session_id)
    return await store.mutate(
        session,
        idempotency_key=idempotency_key,
        operation="complete",
        callback=lambda state: complete_incident(
            {**state, "sessionId": session_id}, session.scenario, body
        ),
    )


async def _report(session_id: str) -> dict[str, Any]:
    session = await store.get(session_id)
    report = session.state.get("report")
    if not report or not session.state.get("investigationCompleted"):
        raise StoreError(
            "REPORT_NOT_READY",
            "Complete the evidence-linked investigation and verify recovery first.",
            409,
        )
    return dict(report)


@router.get("/sessions/{session_id}/report", tags=["completion"])
async def session_report(session_id: str) -> dict[str, Any]:
    return await _report(session_id)


@router.get("/sessions/{session_id}/report.json", tags=["completion"])
async def export_report_json(session_id: str) -> JSONResponse:
    report = await _report(session_id)
    return JSONResponse(
        report,
        media_type="application/json",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{safe_filename(session_id, "report.json")}"'
            )
        },
    )


@router.get("/sessions/{session_id}/timeline.csv", tags=["completion"])
async def export_timeline_csv(session_id: str) -> PlainTextResponse:
    report = await _report(session_id)
    return PlainTextResponse(
        timeline_csv(report),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{safe_filename(session_id, "timeline.csv")}"'
            )
        },
    )


@router.get("/sessions/{session_id}/snapshot", tags=["sessions"])
async def session_snapshot(session_id: str, after: int = 0) -> dict[str, Any]:
    session = await store.get(session_id)
    store.enforce_rate(session)
    events = [event.model_dump() for event in session.events if event.sequence > after]
    return {"snapshot": session.snapshot(), "events": events, "latestSequence": session.sequence}


@router.delete("/sessions/{session_id}", status_code=204, tags=["sessions"])
async def delete_session(session_id: str) -> Response:
    if not await store.delete(session_id):
        raise StoreError("SESSION_NOT_FOUND", "The simulation session was not found.", 404)
    return Response(status_code=204)


@router.websocket("/sessions/{session_id}/stream")
async def session_stream(websocket: WebSocket, session_id: str, after: int = 0) -> None:
    await websocket.accept()
    try:
        session = await store.get(session_id)
    except StoreError as exc:
        await websocket.send_json(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "request_id": websocket.headers.get("x-request-id", "websocket"),
                }
            }
        )
        await websocket.close(code=4404)
        return
    queue: asyncio.Queue[Any] = asyncio.Queue(maxsize=32)
    session.subscribers.add(queue)
    try:
        await websocket.send_json(
            {
                "sequence": session.sequence,
                "type": "snapshot",
                "session_id": session.id,
                "payload": {
                    "snapshot": session.snapshot(),
                    "events": [
                        event.model_dump() for event in session.events if event.sequence > after
                    ],
                },
            }
        )
        while True:
            event = await queue.get()
            await websocket.send_json(event.model_dump())
    except WebSocketDisconnect:
        pass
    finally:
        session.subscribers.discard(queue)
