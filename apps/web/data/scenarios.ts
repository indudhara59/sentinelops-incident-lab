import type { PublicScenarioDefinition } from "@sentinelops/shared";

export const scenarios: readonly PublicScenarioDefinition[] = [
  {
    id: "scenario-midnight-latency-001",
    slug: "midnight-latency-incident",
    title: "The Midnight Latency Incident",
    description:
      "Checkout failures spread through a fictional e-commerce platform while order-service latency climbs after an evening deployment.",
    difficulty: "Intermediate",
    estimatedDurationMinutes: 45,
    environmentType: "Kubernetes e-commerce application",
    organization: "Northstar Market",
    severity: "SEV-2",
    categories: ["Latency", "Database", "Deployment"],
    services: [
      {
        id: "web-store",
        name: "Web storefront",
        type: "Frontend",
        responsibility: "Customer shopping and checkout UI",
      },
      {
        id: "api-gateway",
        name: "API gateway",
        type: "Gateway",
        responsibility: "Routes public application requests",
      },
      {
        id: "checkout-service",
        name: "Checkout service",
        type: "Application",
        responsibility: "Coordinates checkout requests",
      },
      {
        id: "order-service",
        name: "Order service",
        type: "Application",
        responsibility: "Creates and tracks orders",
      },
      {
        id: "orders-db",
        name: "Orders database",
        type: "Database",
        responsibility: "Stores fictional order records",
      },
    ],
    initialAlerts: [
      {
        title: "Checkout latency SLO burn",
        severity: "critical",
        source: "SLO monitor",
        summary: "Checkout p95 latency has exceeded 2 seconds for 8 minutes.",
      },
      {
        title: "Order request failures",
        severity: "warning",
        source: "Service monitor",
        summary: "Order-service 5xx responses are above the warning threshold.",
      },
    ],
    learningObjectives: [
      "Correlate latency across service boundaries",
      "Compare symptoms with recent deployments",
      "Use database saturation signals as evidence",
    ],
    requiredEvidenceCategories: [
      "topology",
      "logs",
      "metrics",
      "traces",
      "alerts",
      "deployments",
    ],
    timeline: {
      startTime: "2026-02-14T23:42:00Z",
      briefingOffsetMinutes: 8,
      simulatedWindowMinutes: 60,
    },
    implementationStatus: "ready",
    initialNotification:
      "Checkout success has fallen sharply during the late-evening sales window. Customers report spinning payment screens and intermittent order failures.",
    knownImpact: [
      "Some customers cannot complete checkout",
      "Successful checkouts are significantly slower",
      "Browsing and catalog traffic appear healthy",
    ],
    availableTools: [
      "Service topology",
      "Structured logs",
      "Metrics and alerts",
      "Distributed traces",
      "Deployment history",
      "Evidence notebook",
    ],
  },
  {
    id: "scenario-queue-breaking-point-002",
    slug: "queue-at-the-breaking-point",
    title: "Queue at the Breaking Point",
    description:
      "A fictional notification platform accumulates a growing backlog as consumers slow down and retries multiply the load.",
    difficulty: "Intermediate",
    estimatedDurationMinutes: 35,
    environmentType: "Event-driven messaging platform",
    organization: "Beacon Communications",
    severity: "SEV-2",
    categories: ["Message queues", "Resource exhaustion"],
    services: [
      {
        id: "notification-api",
        name: "Notification API",
        type: "Application",
        responsibility: "Accepts notification requests",
      },
      {
        id: "delivery-queue",
        name: "Delivery queue",
        type: "Message queue",
        responsibility: "Buffers outbound work",
      },
      {
        id: "notification-worker",
        name: "Notification consumer",
        type: "Worker",
        responsibility: "Processes queued deliveries",
      },
      {
        id: "provider-adapter",
        name: "Provider adapter",
        type: "Integration",
        responsibility: "Sends fictional external deliveries",
      },
    ],
    initialAlerts: [
      {
        title: "Queue age rising",
        severity: "critical",
        source: "Queue monitor",
        summary: "Oldest message age has exceeded the delivery objective.",
      },
    ],
    learningObjectives: [
      "Interpret queue depth and message age",
      "Recognize retry amplification",
      "Separate producer load from consumer throughput",
    ],
    requiredEvidenceCategories: ["topology", "logs", "metrics", "alerts"],
    timeline: {
      startTime: "2026-03-03T10:15:00Z",
      briefingOffsetMinutes: 10,
      simulatedWindowMinutes: 45,
    },
    implementationStatus: "ready",
    initialNotification:
      "Transactional notifications are arriving late. The delivery backlog continues to grow even though incoming request volume is stable.",
    knownImpact: [
      "Notification delivery is delayed",
      "No messages are known to be lost",
      "API request acceptance remains healthy",
    ],
    availableTools: [
      "Service topology",
      "Queue metrics",
      "Structured logs",
      "Alerts",
      "Evidence notebook",
    ],
  },
  {
    id: "scenario-memory-pressure-003",
    slug: "memory-under-pressure",
    title: "Memory Under Pressure",
    description:
      "Memory rises gradually across an image-processing fleet until containers restart and customer jobs must be retried.",
    difficulty: "Beginner",
    estimatedDurationMinutes: 25,
    environmentType: "Containerized media pipeline",
    organization: "PixelForge Studio",
    severity: "SEV-3",
    categories: ["Resource exhaustion", "Availability"],
    services: [
      {
        id: "upload-api",
        name: "Upload API",
        type: "Application",
        responsibility: "Accepts fictional media jobs",
      },
      {
        id: "image-worker",
        name: "Image processor",
        type: "Worker",
        responsibility: "Resizes and optimizes images",
      },
      {
        id: "job-queue",
        name: "Media job queue",
        type: "Message queue",
        responsibility: "Buffers processing jobs",
      },
    ],
    initialAlerts: [
      {
        title: "Container restart rate",
        severity: "warning",
        source: "Container monitor",
        summary: "Image-processing pods are restarting above baseline.",
      },
    ],
    learningObjectives: [
      "Read memory working-set trends",
      "Connect restarts with user impact",
      "Distinguish a leak from a traffic spike",
    ],
    requiredEvidenceCategories: ["logs", "metrics", "alerts", "deployments"],
    timeline: {
      startTime: "2026-04-18T14:20:00Z",
      briefingOffsetMinutes: 15,
      simulatedWindowMinutes: 40,
    },
    implementationStatus: "ready",
    initialNotification:
      "Image transformations are taking longer and a small but increasing number of jobs are being retried after worker restarts.",
    knownImpact: [
      "Image-processing latency is elevated",
      "Some jobs retry automatically",
      "Uploads continue to be accepted",
    ],
    availableTools: [
      "Service topology",
      "Container metrics",
      "Application logs",
      "Deployment history",
      "Evidence notebook",
    ],
  },
  {
    id: "scenario-auth-storm-004",
    slug: "authentication-storm",
    title: "The Authentication Storm",
    description:
      "A fictional identity service sees increased failed sign-ins, rate-limit alerts, and credential-stuffing-like simulated traffic.",
    difficulty: "Advanced",
    estimatedDurationMinutes: 50,
    environmentType: "Multi-tenant identity platform",
    organization: "Harborline Software",
    severity: "SEV-2",
    categories: ["Authentication", "Security monitoring"],
    services: [
      {
        id: "auth-gateway",
        name: "Authentication gateway",
        type: "Gateway",
        responsibility: "Receives sign-in requests",
      },
      {
        id: "identity-service",
        name: "Identity service",
        type: "Application",
        responsibility: "Validates fictional identities",
      },
      {
        id: "rate-limiter",
        name: "Rate limiter",
        type: "Security control",
        responsibility: "Enforces defensive request limits",
      },
      {
        id: "identity-db",
        name: "Identity database",
        type: "Database",
        responsibility: "Stores fictional account records",
      },
    ],
    initialAlerts: [
      {
        title: "Failed sign-in anomaly",
        severity: "critical",
        source: "Defensive security monitor",
        summary:
          "Failed sign-ins and distributed rate-limit events exceed expected patterns.",
      },
    ],
    learningObjectives: [
      "Analyze authentication signals defensively",
      "Assess rate-limit effectiveness",
      "Protect legitimate user availability",
    ],
    requiredEvidenceCategories: ["logs", "metrics", "alerts", "topology"],
    timeline: {
      startTime: "2026-05-08T03:05:00Z",
      briefingOffsetMinutes: 5,
      simulatedWindowMinutes: 55,
    },
    implementationStatus: "ready",
    initialNotification:
      "Support reports legitimate users are seeing more sign-in challenges while defensive monitors detect a distributed increase in failed attempts.",
    knownImpact: [
      "Some legitimate sign-ins are delayed",
      "Failed attempts are elevated",
      "Analysis is defensive and entirely simulated",
    ],
    availableTools: [
      "Defensive authentication logs",
      "Rate-limit metrics",
      "Alerts",
      "Service topology",
      "Evidence notebook",
    ],
  },
  {
    id: "scenario-cascading-checkout-005",
    slug: "cascading-checkout-failure",
    title: "Cascading Checkout Failure",
    description:
      "Payment degradation produces upstream timeouts while retries amplify pressure across a fictional checkout path.",
    difficulty: "Advanced",
    estimatedDurationMinutes: 55,
    environmentType: "Microservice retail platform",
    organization: "Juniper Outfitters",
    severity: "SEV-1",
    categories: ["Cascading failure", "Latency", "Availability"],
    services: [
      {
        id: "checkout-api",
        name: "Checkout API",
        type: "Application",
        responsibility: "Coordinates checkout",
      },
      {
        id: "payment-service",
        name: "Payment service",
        type: "Application",
        responsibility: "Processes fictional payments",
      },
      {
        id: "payment-adapter",
        name: "Payment adapter",
        type: "Integration",
        responsibility: "Calls a simulated provider",
      },
      {
        id: "order-service",
        name: "Order service",
        type: "Application",
        responsibility: "Creates fictional orders",
      },
      {
        id: "api-gateway",
        name: "API gateway",
        type: "Gateway",
        responsibility: "Routes customer requests",
      },
      {
        id: "retry-worker",
        name: "Retry worker",
        type: "Worker",
        responsibility: "Processes deferred attempts",
      },
    ],
    initialAlerts: [
      {
        title: "Checkout availability",
        severity: "critical",
        source: "SLO monitor",
        summary:
          "Checkout availability has fallen below the critical objective.",
      },
      {
        title: "Payment timeout rate",
        severity: "critical",
        source: "Trace monitor",
        summary: "Payment spans increasingly exceed the upstream timeout.",
      },
    ],
    learningObjectives: [
      "Map a cascading failure",
      "Recognize retry amplification",
      "Prioritize mitigation by blast radius",
    ],
    requiredEvidenceCategories: [
      "topology",
      "logs",
      "metrics",
      "traces",
      "alerts",
    ],
    timeline: {
      startTime: "2026-06-21T16:30:00Z",
      briefingOffsetMinutes: 4,
      simulatedWindowMinutes: 65,
    },
    implementationStatus: "ready",
    initialNotification:
      "Checkout availability is falling rapidly. Several upstream services report timeouts after payment processing began to degrade.",
    knownImpact: [
      "Checkout availability is critically reduced",
      "Retry traffic is rising",
      "Browsing remains available",
    ],
    availableTools: [
      "Service topology",
      "Logs",
      "Metrics and alerts",
      "Distributed traces",
      "Evidence notebook",
    ],
  },
] as const;

export function getScenarioBySlug(
  slug: string,
): PublicScenarioDefinition | undefined {
  return scenarios.find((scenario) => scenario.slug === slug);
}

export const serviceTypes = [
  ...new Set(
    scenarios.flatMap((scenario) =>
      scenario.services.map((service) => service.type),
    ),
  ),
].sort();
