from dataclasses import dataclass

from app.simulation.models import ScenarioSummary


@dataclass(frozen=True)
class ScenarioDefinition:
    public: ScenarioSummary
    stages: tuple[tuple[int, str], ...]
    version: str
    truth: "TruthModel"


@dataclass(frozen=True)
class TruthModel:
    affected_service: str
    failure_mechanism: str
    triggering_change: str
    primary_mitigation: str
    root_cause_summary: str
    contributing_factors: tuple[str, ...]
    required_evidence_sources: frozenset[str]


MIDNIGHT_LATENCY = ScenarioDefinition(
    public=ScenarioSummary(
        id="scenario-midnight-latency",
        slug="midnight-latency-incident",
        title="The Midnight Latency Incident",
        description=(
            "Checkout failures and rising order-service latency in a fictional "
            "e-commerce environment."
        ),
        difficulty="Intermediate",
        estimated_duration=35,
        implementation_status="ready",
    ),
    stages=(
        (0, "Normal"),
        (30, "Deployment completed"),
        (60, "Connection leak begins"),
        (90, "Database pool saturation"),
        (120, "Order-service latency increase"),
        (150, "Checkout errors"),
    ),
    version="midnight-latency@1.0.0",
    truth=TruthModel(
        affected_service="order-service",
        failure_mechanism="database-connections-not-released",
        triggering_change="order-service-2.14.7-deployment",
        primary_mitigation="rollback-order-service-2.14.7",
        root_cause_summary=(
            "Order-service version 2.14.7 failed to release database connections "
            "on an error path, saturating the pool and degrading checkout."
        ),
        contributing_factors=(
            "Connection-pool saturation amplified request wait time.",
            "Checkout traffic continued while the pool approached its ceiling.",
        ),
        required_evidence_sources=frozenset({"Logs", "Metrics", "Traces", "Deployments"}),
    ),
)

_REGISTRY = {MIDNIGHT_LATENCY.public.slug: MIDNIGHT_LATENCY}


def list_scenarios() -> list[ScenarioSummary]:
    return [definition.public for definition in _REGISTRY.values()]


def get_scenario(slug: str) -> ScenarioDefinition | None:
    return _REGISTRY.get(slug)
