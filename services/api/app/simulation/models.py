from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=240)]
Identifier = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9._:-]{1,128}$")]


class ScenarioSummary(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    difficulty: str
    estimated_duration: int
    implementation_status: str


class CreateSessionRequest(BaseModel):
    scenario_slug: str
    seed: int | None = Field(default=None, ge=0, le=4_294_967_295)


class ActionRequest(BaseModel):
    action: Literal[
        "restart",
        "scale",
        "rollback",
        "increase-pool",
        "disable-retry",
        "pause-consumer",
        "observe",
        "ack-alert",
        "assign-alert",
        "silence-alert",
    ]
    target_id: Identifier | None = None


class EvidenceRequest(BaseModel):
    id: Identifier
    source: Literal["Logs", "Metrics", "Traces", "Deployments", "Alerts"]
    timestamp: str
    service: ShortText
    summary: ShortText
    fields: dict[str, str | int | float | bool] = Field(default_factory=dict, max_length=40)
    annotation: str = Field(default="", max_length=2_000)


class HypothesisRequest(BaseModel):
    title: ShortText
    notes: str = Field(default="", max_length=4_000)


class HypothesisPatch(BaseModel):
    title: ShortText | None = None
    notes: str | None = Field(default=None, max_length=4_000)
    status: Literal["unresolved", "supported", "contradicted"] | None = None
    evidence_ids: list[Identifier] | None = Field(default=None, max_length=100)


class RootCauseSubmission(BaseModel):
    affected_service: Identifier
    failure_mechanism: Identifier
    triggering_change: Identifier
    supporting_evidence: list[Identifier] = Field(min_length=3, max_length=20)
    rejected_alternatives: list[ShortText] = Field(default_factory=list, max_length=8)
    proposed_mitigation: Identifier
    confidence: int = Field(ge=0, le=100)


class RecoveryVerificationRequest(BaseModel):
    evidence_ids: list[Identifier] = Field(min_length=2, max_length=20)
    observation: str = Field(min_length=20, max_length=2_000)


class CompletionRequest(BaseModel):
    incident_summary: str = Field(min_length=40, max_length=4_000)
    customer_impact: str = Field(min_length=20, max_length=2_000)
    lessons_learned: list[ShortText] = Field(min_length=1, max_length=10)
    follow_up_actions: list[ShortText] = Field(min_length=1, max_length=10)


class EventEnvelope(BaseModel):
    sequence: int
    type: Literal[
        "telemetry.batch",
        "state.updated",
        "action.result",
        "snapshot",
        "session.cancelled",
    ]
    session_id: str
    payload: dict[str, Any]


class SessionResponse(BaseModel):
    id: str
    scenario_slug: str
    seed: int
    version: int
    expires_at: str
    snapshot: dict[str, Any]
