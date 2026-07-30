from dataclasses import dataclass

from app.simulation.models import ScenarioSummary


@dataclass(frozen=True)
class ServiceProfile:
    id: str
    name: str
    type: str
    dependencies: tuple[str, ...] = ()


@dataclass(frozen=True)
class AlertProfile:
    id: str
    title: str
    severity: str
    source: str
    service: str
    first_triggered: int
    metric: str


@dataclass(frozen=True)
class EvidenceProfile:
    id: str
    source: str
    available_at: int
    service: str
    summary: str
    fields: tuple[tuple[str, str | int | float | bool], ...]


@dataclass(frozen=True)
class RuntimeProfile:
    kind: str
    services: tuple[ServiceProfile, ...]
    affected_services: tuple[str, ...]
    alerts: tuple[AlertProfile, ...]
    evidence: tuple[EvidenceProfile, ...]
    alternative_hypotheses: tuple[str, ...]
    allowed_actions: tuple[str, ...]
    primary_action: str
    temporary_actions: tuple[str, ...]
    risky_actions: tuple[str, ...]
    conclusion_services: tuple[str, ...]
    conclusion_mechanisms: tuple[str, ...]
    conclusion_triggers: tuple[str, ...]
    conclusion_mitigations: tuple[str, ...]
    recovery_thresholds: tuple[tuple[str, str, float], ...]
    better_path: tuple[str, ...]


@dataclass(frozen=True)
class ScenarioDefinition:
    public: ScenarioSummary
    stages: tuple[tuple[int, str], ...]
    version: str
    truth: "TruthModel"
    runtime: RuntimeProfile


@dataclass(frozen=True)
class TruthModel:
    affected_service: str
    failure_mechanism: str
    triggering_change: str
    primary_mitigation: str
    root_cause_summary: str
    contributing_factors: tuple[str, ...]
    required_evidence_sources: frozenset[str]


def _service(id: str, name: str, type: str, *dependencies: str) -> ServiceProfile:
    return ServiceProfile(id, name, type, dependencies)


def _evidence(
    id: str,
    source: str,
    at: int,
    service: str,
    summary: str,
    **fields: str | int | float | bool,
) -> EvidenceProfile:
    return EvidenceProfile(id, source, at, service, summary, tuple(fields.items()))


MIDNIGHT_LATENCY = ScenarioDefinition(
    public=ScenarioSummary(
        id="scenario-midnight-latency-001",
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
        "order-service",
        "database-connections-not-released",
        "order-service-2.14.7-deployment",
        "rollback-order-service-2.14.7",
        "Order-service version 2.14.7 failed to release database connections on an "
        "error path, saturating the pool and degrading checkout.",
        (
            "Connection-pool saturation amplified request wait time.",
            "Checkout traffic continued while the pool approached its ceiling.",
        ),
        frozenset({"Logs", "Metrics", "Traces", "Deployments"}),
    ),
    runtime=RuntimeProfile(
        "latency",
        (
            _service("web", "Web frontend", "Frontend", "gateway"),
            _service("gateway", "API gateway", "Gateway", "auth", "catalog", "cart", "order"),
            _service("auth", "Authentication service", "Application"),
            _service("catalog", "Catalog service", "Application"),
            _service("cart", "Cart service", "Application", "order"),
            _service("order", "Order service", "Application", "orders-db", "payment", "queue"),
            _service("payment", "Payment service", "Application"),
            _service("orders-db", "Orders database", "Database"),
            _service("queue", "Message queue", "Message queue", "notification"),
            _service("notification", "Notification service", "Worker"),
        ),
        ("order", "orders-db", "gateway"),
        (
            AlertProfile(
                "alert-db-pool",
                "Orders database pool saturation",
                "warning",
                "metrics",
                "orders-db",
                90,
                "dbPoolUtilizationPercent",
            ),
            AlertProfile(
                "alert-order-latency",
                "Order-service latency SLO burn",
                "critical",
                "metrics",
                "order",
                120,
                "orderLatencyMs",
            ),
            AlertProfile(
                "alert-checkout-errors",
                "Checkout error rate elevated",
                "critical",
                "logs",
                "gateway",
                150,
                "checkoutErrorRate",
            ),
        ),
        (
            _evidence(
                "ev-deploy-2147",
                "Deployments",
                30,
                "Order service",
                "Version 2.14.7 completed shortly before impact.",
                version="2.14.7",
            ),
            _evidence(
                "ev-metric-pool",
                "Metrics",
                90,
                "Orders database",
                "Connections reach the pool ceiling while traffic stays stable.",
                active=40,
                maximum=40,
            ),
            _evidence(
                "ev-log-timeout",
                "Logs",
                120,
                "Order service",
                "Requests time out waiting for database connections.",
                event="pool_acquire_timeout",
            ),
            _evidence(
                "ev-trace-wait",
                "Traces",
                120,
                "Order service",
                "Checkout traces spend most time acquiring a connection.",
                span="db.connection.acquire",
            ),
            _evidence(
                "ev-alert-checkout",
                "Alerts",
                150,
                "API gateway",
                "Checkout errors cross the critical threshold.",
                error_rate="12.8%",
            ),
        ),
        (
            "A slow database query is consuming the pool.",
            "Traffic exceeds order-service capacity.",
            "The payment provider is slow.",
        ),
        ("restart", "scale", "rollback", "increase-pool", "disable-retry", "observe"),
        "rollback",
        ("restart", "scale", "increase-pool"),
        ("increase-pool",),
        ("api-gateway", "order-service", "orders-database", "payment-service"),
        (
            "database-connections-not-released",
            "slow-database-queries",
            "traffic-capacity-shortfall",
            "payment-provider-latency",
        ),
        (
            "order-service-2.14.7-deployment",
            "traffic-increase",
            "database-maintenance",
            "no-recent-change",
        ),
        (
            "rollback-order-service-2.14.7",
            "restart-order-service",
            "scale-order-service",
            "increase-database-pool",
            "continue-observing",
        ),
        (
            ("orderLatencyMs", "lt", 500),
            ("checkoutErrorRate", "lt", 1),
            ("dbPoolUtilizationPercent", "lt", 70),
        ),
        (
            "Confirm checkout impact and active alerts.",
            "Correlate the deployment with pool, log, and trace evidence.",
            "Roll back the faulty release and verify stable recovery.",
        ),
    ),
)


QUEUE_BREAKING_POINT = ScenarioDefinition(
    public=ScenarioSummary(
        id="scenario-queue-breaking-point-002",
        slug="queue-at-the-breaking-point",
        title="Queue at the Breaking Point",
        description=(
            "A notification backlog accelerates as consumer processing slows and "
            "retries amplify work."
        ),
        difficulty="Intermediate",
        estimated_duration=35,
        implementation_status="ready",
    ),
    stages=(
        (0, "Normal"),
        (30, "Consumer slowdown"),
        (60, "Backlog growing"),
        (90, "Retry storm"),
        (120, "Delivery delays"),
        (150, "Queue saturation"),
    ),
    version="queue-breaking-point@1.0.0",
    truth=TruthModel(
        "notification-consumer",
        "retry-amplification",
        "consumer-version-4.8.0",
        "disable-consumer-retries",
        "Notification consumer version 4.8.0 slowed processing; aggressive retries "
        "multiplied outstanding messages and saturated the delivery queue.",
        ("Retry delay lacked jitter.", "Producer admission continued after consumer lag alarms."),
        frozenset({"Logs", "Metrics", "Traces", "Deployments"}),
    ),
    runtime=RuntimeProfile(
        "queue",
        (
            _service("notification-api", "Notification API", "Application", "delivery-queue"),
            _service("delivery-queue", "Delivery queue", "Message queue", "notification-consumer"),
            _service(
                "notification-consumer",
                "Notification consumer",
                "Worker",
                "template-service",
                "provider-gateway",
            ),
            _service("template-service", "Template service", "Application"),
            _service("provider-gateway", "Delivery provider gateway", "Gateway"),
        ),
        ("delivery-queue", "notification-consumer", "notification-api"),
        (
            AlertProfile(
                "alert-queue-depth",
                "Delivery queue depth critical",
                "critical",
                "metrics",
                "delivery-queue",
                90,
                "queueDepth",
            ),
            AlertProfile(
                "alert-consumer-lag",
                "Consumer processing lag",
                "warning",
                "metrics",
                "notification-consumer",
                60,
                "orderLatencyMs",
            ),
            AlertProfile(
                "alert-delivery-delay",
                "Notification delivery SLO burn",
                "critical",
                "traces",
                "notification-api",
                120,
                "checkoutErrorRate",
            ),
        ),
        (
            _evidence(
                "queue-deploy",
                "Deployments",
                30,
                "Notification consumer",
                "Consumer version 4.8.0 preceded the slowdown.",
                version="4.8.0",
            ),
            _evidence(
                "queue-depth",
                "Metrics",
                90,
                "Delivery queue",
                "Queue depth grows faster than original publish rate.",
                retries="3.4x",
            ),
            _evidence(
                "queue-log",
                "Logs",
                90,
                "Notification consumer",
                "Retry attempts recur without jitter.",
                retry_delay_ms=100,
            ),
            _evidence(
                "queue-trace",
                "Traces",
                120,
                "Notification consumer",
                "Repeated delivery spans outnumber original messages.",
                amplification=3.4,
            ),
            _evidence(
                "queue-alert",
                "Alerts",
                120,
                "Notification API",
                "Delivery SLO is burning.",
                delay_minutes=18,
            ),
        ),
        (
            "Producer traffic surged unexpectedly.",
            "The provider gateway is fully unavailable.",
            "Template rendering is CPU bound.",
        ),
        ("restart", "scale", "rollback", "disable-retry", "pause-consumer", "observe"),
        "disable-retry",
        ("scale", "restart"),
        ("pause-consumer",),
        ("notification-consumer", "delivery-queue", "notification-api", "provider-gateway"),
        (
            "retry-amplification",
            "producer-traffic-spike",
            "provider-outage",
            "template-cpu-saturation",
        ),
        ("consumer-version-4.8.0", "traffic-increase", "provider-change", "no-recent-change"),
        (
            "disable-consumer-retries",
            "rollback-consumer",
            "scale-consumers",
            "pause-consumer",
            "continue-observing",
        ),
        (("queueDepth", "lt", 80), ("orderLatencyMs", "lt", 500), ("checkoutErrorRate", "lt", 1)),
        (
            "Confirm backlog age and delivery impact.",
            "Compare original messages with retry volume.",
            "Control retry amplification and verify queue drain.",
        ),
    ),
)


MEMORY_PRESSURE = ScenarioDefinition(
    public=ScenarioSummary(
        id="scenario-memory-pressure-003",
        slug="memory-under-pressure",
        title="Memory Under Pressure",
        description=(
            "Image-processing workers consume steadily increasing memory and begin restarting."
        ),
        difficulty="Beginner",
        estimated_duration=30,
        implementation_status="ready",
    ),
    stages=(
        (0, "Normal"),
        (30, "Worker deployment"),
        (60, "Memory growth"),
        (90, "Memory pressure"),
        (120, "Container restarts"),
        (150, "Processing failures"),
    ),
    version="memory-pressure@1.0.0",
    truth=TruthModel(
        "image-worker",
        "retained-image-buffers",
        "image-worker-3.3.1",
        "rollback-image-worker",
        "Image worker 3.3.1 retained decoded image buffers after completed jobs, "
        "causing monotonic memory growth and container restarts.",
        (
            "Large-image traffic accelerated exhaustion.",
            "Restart policy temporarily hid the trend.",
        ),
        frozenset({"Logs", "Metrics", "Traces", "Deployments"}),
    ),
    runtime=RuntimeProfile(
        "memory",
        (
            _service("upload-api", "Upload API", "Application", "job-queue", "object-store"),
            _service("job-queue", "Image job queue", "Message queue", "image-worker"),
            _service(
                "image-worker", "Image processing service", "Worker", "object-store", "metadata-db"
            ),
            _service("object-store", "Simulated object store", "Storage"),
            _service("metadata-db", "Image metadata database", "Database"),
        ),
        ("image-worker", "job-queue", "upload-api"),
        (
            AlertProfile(
                "alert-memory",
                "Worker memory above limit",
                "warning",
                "metrics",
                "image-worker",
                90,
                "memoryMb",
            ),
            AlertProfile(
                "alert-restarts",
                "Container restart rate elevated",
                "critical",
                "metrics",
                "image-worker",
                120,
                "serviceRestarts",
            ),
            AlertProfile(
                "alert-image-fail",
                "Image processing failures",
                "critical",
                "logs",
                "upload-api",
                150,
                "checkoutErrorRate",
            ),
        ),
        (
            _evidence(
                "memory-deploy",
                "Deployments",
                30,
                "Image processing service",
                "Version 3.3.1 changed image buffer handling.",
                version="3.3.1",
            ),
            _evidence(
                "memory-metric",
                "Metrics",
                90,
                "Image processing service",
                "Memory rises with completed jobs and does not return to baseline.",
                pattern="monotonic",
            ),
            _evidence(
                "memory-log",
                "Logs",
                120,
                "Image processing service",
                "Container terminates at the memory limit.",
                reason="OOMKilled",
            ),
            _evidence(
                "memory-trace",
                "Traces",
                120,
                "Image processing service",
                "Completed image spans correlate with retained memory growth.",
                operation="decode-image",
            ),
            _evidence(
                "memory-alert",
                "Alerts",
                150,
                "Upload API",
                "Processing failures exceed threshold.",
                failures="9.2%",
            ),
        ),
        (
            "The job queue is overloaded.",
            "Object storage latency causes buffering.",
            "A temporary traffic spike exceeds capacity.",
        ),
        ("restart", "scale", "rollback", "pause-consumer", "observe"),
        "rollback",
        ("restart", "scale"),
        ("pause-consumer",),
        ("image-worker", "job-queue", "upload-api", "object-store"),
        ("retained-image-buffers", "queue-overload", "storage-latency", "capacity-shortfall"),
        ("image-worker-3.3.1", "traffic-increase", "storage-change", "no-recent-change"),
        (
            "rollback-image-worker",
            "restart-workers",
            "scale-workers",
            "pause-intake",
            "continue-observing",
        ),
        (("memoryMb", "lt", 600), ("serviceRestarts", "lt", 2), ("checkoutErrorRate", "lt", 1)),
        (
            "Confirm restart and processing impact.",
            "Correlate memory growth with completed image jobs and the deployment.",
            "Roll back the worker and observe stable memory.",
        ),
    ),
)


AUTH_STORM = ScenarioDefinition(
    public=ScenarioSummary(
        id="scenario-auth-storm-004",
        slug="authentication-storm",
        title="The Authentication Storm",
        description=(
            "Defenders investigate simulated credential-stuffing-like traffic and "
            "rate-limit pressure."
        ),
        difficulty="Advanced",
        estimated_duration=40,
        implementation_status="ready",
    ),
    stages=(
        (0, "Normal"),
        (30, "Failed sign-ins rising"),
        (60, "Distributed traffic"),
        (90, "Rate-limit pressure"),
        (120, "Legitimate users delayed"),
        (150, "Authentication degradation"),
    ),
    version="authentication-storm@1.0.0",
    truth=TruthModel(
        "auth-service",
        "credential-stuffing-simulation",
        "distributed-sign-in-burst",
        "enable-adaptive-rate-limits",
        "Distributed simulated sign-in attempts exhausted defensive rate-limit capacity; "
        "adaptive limiting restores legitimate access without exposing offensive instructions.",
        (
            "Uniform retry timing amplified load.",
            "Global limits did not distinguish trusted flows.",
        ),
        frozenset({"Logs", "Metrics", "Traces", "Alerts"}),
    ),
    runtime=RuntimeProfile(
        "auth",
        (
            _service("login-web", "Login frontend", "Frontend", "auth-gateway"),
            _service(
                "auth-gateway", "Authentication gateway", "Gateway", "auth-service", "risk-engine"
            ),
            _service("auth-service", "Authentication service", "Application", "identity-db"),
            _service("risk-engine", "Defensive risk engine", "Security service"),
            _service("identity-db", "Identity database", "Database"),
            _service("audit-stream", "Security audit stream", "Message queue"),
        ),
        ("auth-service", "auth-gateway", "risk-engine"),
        (
            AlertProfile(
                "alert-signins",
                "Failed sign-ins elevated",
                "warning",
                "logs",
                "auth-service",
                30,
                "checkoutErrorRate",
            ),
            AlertProfile(
                "alert-rate-limit",
                "Rate-limit capacity pressure",
                "critical",
                "metrics",
                "auth-gateway",
                90,
                "requestRate",
            ),
            AlertProfile(
                "alert-login-slo",
                "Legitimate sign-in SLO burn",
                "critical",
                "traces",
                "login-web",
                120,
                "orderLatencyMs",
            ),
        ),
        (
            _evidence(
                "auth-alert",
                "Alerts",
                30,
                "Authentication service",
                "Failed sign-ins rise across many simulated source identities.",
                distribution="distributed",
            ),
            _evidence(
                "auth-metric",
                "Metrics",
                90,
                "Authentication gateway",
                "Attempt rate and limiter occupancy rise together.",
                attempts_per_minute=4800,
            ),
            _evidence(
                "auth-log",
                "Logs",
                90,
                "Defensive risk engine",
                "Repeated failures span simulated accounts and source identities.",
                safe="defensive-only",
            ),
            _evidence(
                "auth-trace",
                "Traces",
                120,
                "Authentication service",
                "Legitimate requests wait behind defensive limiter work.",
                span="risk.evaluate",
            ),
            _evidence(
                "auth-baseline",
                "Deployments",
                60,
                "Authentication gateway",
                "No deployment coincides with the sign-in burst.",
                version="unchanged",
            ),
        ),
        (
            "A login deployment introduced failures.",
            "The identity database is unavailable.",
            "Legitimate campaign traffic explains all attempts.",
        ),
        ("scale", "disable-retry", "observe"),
        "disable-retry",
        ("scale",),
        (),
        ("auth-service", "auth-gateway", "identity-database", "risk-engine"),
        (
            "credential-stuffing-simulation",
            "deployment-regression",
            "identity-database-outage",
            "legitimate-traffic-spike",
        ),
        (
            "distributed-sign-in-burst",
            "auth-deployment",
            "database-maintenance",
            "no-recent-change",
        ),
        (
            "enable-adaptive-rate-limits",
            "scale-auth-service",
            "disable-authentication",
            "continue-observing",
        ),
        (
            ("checkoutErrorRate", "lt", 1),
            ("orderLatencyMs", "lt", 500),
            ("requestRate", "lt", 1500),
        ),
        (
            "Confirm legitimate-user impact without inspecting real identities.",
            "Correlate safe failure distribution, limiter pressure, and traces.",
            "Apply defensive adaptive controls and verify access recovery.",
        ),
    ),
)


CASCADING_CHECKOUT = ScenarioDefinition(
    public=ScenarioSummary(
        id="scenario-cascading-checkout-005",
        slug="cascading-checkout-failure",
        title="Cascading Checkout Failure",
        description=(
            "Payment degradation triggers upstream timeouts and retry amplification "
            "across checkout."
        ),
        difficulty="Advanced",
        estimated_duration=45,
        implementation_status="ready",
    ),
    stages=(
        (0, "Normal"),
        (30, "Payment degradation"),
        (60, "Upstream timeouts"),
        (90, "Retries increasing"),
        (120, "Resource contention"),
        (150, "Cascading checkout failure"),
    ),
    version="cascading-checkout@1.0.0",
    truth=TruthModel(
        "payment-service",
        "synchronized-retry-amplification",
        "payment-service-degradation",
        "disable-checkout-retries",
        "Payment-service degradation was amplified by synchronized checkout retries, "
        "spreading timeouts and resource contention upstream.",
        ("Timeout budgets were not propagated.", "Retries lacked jitter and a shared budget."),
        frozenset({"Logs", "Metrics", "Traces", "Alerts"}),
    ),
    runtime=RuntimeProfile(
        "cascade",
        (
            _service("storefront", "Storefront", "Frontend", "checkout-api"),
            _service(
                "checkout-api", "Checkout API", "Application", "order-service", "payment-service"
            ),
            _service("order-service", "Order service", "Application", "orders-db"),
            _service("payment-service", "Payment service", "Application", "payment-gateway"),
            _service("payment-gateway", "Simulated payment gateway", "Gateway"),
            _service("orders-db", "Orders database", "Database"),
            _service("event-bus", "Order event bus", "Message queue"),
        ),
        ("payment-service", "checkout-api", "order-service"),
        (
            AlertProfile(
                "alert-payment",
                "Payment-service latency",
                "warning",
                "metrics",
                "payment-service",
                30,
                "orderLatencyMs",
            ),
            AlertProfile(
                "alert-retries",
                "Checkout retry volume",
                "critical",
                "traces",
                "checkout-api",
                90,
                "requestRate",
            ),
            AlertProfile(
                "alert-cascade",
                "Checkout availability SLO burn",
                "critical",
                "logs",
                "storefront",
                150,
                "checkoutErrorRate",
            ),
        ),
        (
            _evidence(
                "cascade-alert",
                "Alerts",
                30,
                "Payment service",
                "Payment latency rises before upstream failures.",
                latency_ms=1400,
            ),
            _evidence(
                "cascade-metric",
                "Metrics",
                90,
                "Checkout API",
                "Request rate triples while customer traffic is stable.",
                amplification=3,
            ),
            _evidence(
                "cascade-log",
                "Logs",
                90,
                "Checkout API",
                "Timeouts trigger synchronized retries.",
                retry_policy="fixed",
            ),
            _evidence(
                "cascade-trace",
                "Traces",
                120,
                "Payment service",
                "Repeated payment spans dominate the critical path.",
                repeats=3,
            ),
            _evidence(
                "cascade-deploy",
                "Deployments",
                60,
                "Checkout API",
                "No checkout deployment explains the onset.",
                version="unchanged",
            ),
        ),
        (
            "The orders database is saturated first.",
            "A checkout deployment caused the failures.",
            "Customer traffic alone exceeds capacity.",
        ),
        ("restart", "scale", "disable-retry", "observe"),
        "disable-retry",
        ("scale", "restart"),
        (),
        ("payment-service", "checkout-api", "order-service", "orders-database"),
        (
            "synchronized-retry-amplification",
            "database-saturation",
            "deployment-regression",
            "traffic-capacity-shortfall",
        ),
        (
            "payment-service-degradation",
            "checkout-deployment",
            "traffic-increase",
            "database-maintenance",
        ),
        (
            "disable-checkout-retries",
            "scale-checkout",
            "restart-payment-service",
            "continue-observing",
        ),
        (
            ("orderLatencyMs", "lt", 500),
            ("checkoutErrorRate", "lt", 1),
            ("requestRate", "lt", 1000),
        ),
        (
            "Establish the sequence of payment and upstream impact.",
            "Compare customer traffic with retry-amplified request volume.",
            "Limit retries and verify end-to-end checkout recovery.",
        ),
    ),
)


_REGISTRY = {
    scenario.public.slug: scenario
    for scenario in (
        MIDNIGHT_LATENCY,
        QUEUE_BREAKING_POINT,
        MEMORY_PRESSURE,
        AUTH_STORM,
        CASCADING_CHECKOUT,
    )
}


def list_scenarios() -> list[ScenarioSummary]:
    return [definition.public for definition in _REGISTRY.values()]


def get_scenario(slug: str) -> ScenarioDefinition | None:
    return _REGISTRY.get(slug)
