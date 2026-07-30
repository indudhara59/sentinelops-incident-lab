from dataclasses import dataclass

from app.simulation.models import ScenarioSummary


@dataclass(frozen=True)
class ScenarioDefinition:
    public: ScenarioSummary
    stages: tuple[tuple[int, str], ...]


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
)

_REGISTRY = {MIDNIGHT_LATENCY.public.slug: MIDNIGHT_LATENCY}


def list_scenarios() -> list[ScenarioSummary]:
    return [definition.public for definition in _REGISTRY.values()]


def get_scenario(slug: str) -> ScenarioDefinition | None:
    return _REGISTRY.get(slug)
