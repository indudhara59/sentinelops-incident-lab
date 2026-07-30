import "server-only";
import type { PrivateScenarioDefinition } from "@sentinelops/shared";

/** Facilitator-only Phase 2 definitions. This module must never enter a client bundle. */
export const scenarioSecrets: readonly PrivateScenarioDefinition[] = [
  {
    scenarioId: "scenario-midnight-latency-001",
    rootCauseSummary:
      "A deployment introduced a database connection-pool leak in order-service.",
    validCorrectiveActions: [
      "Roll back the affected deployment",
      "Restart affected instances after traffic is controlled",
    ],
    incorrectActionExplanations: {
      "scale-database":
        "Database capacity does not release leaked application connections.",
      "disable-checkout":
        "This increases impact before lower-risk mitigations are evaluated.",
    },
    hiddenEvidence: [
      "Connection checkout paths omit release after a specific error branch.",
    ],
  },
  {
    scenarioId: "scenario-queue-breaking-point-002",
    rootCauseSummary:
      "Slower consumer processing combines with aggressive retries to create a retry storm.",
    validCorrectiveActions: ["Control retries", "Restore consumer throughput"],
    incorrectActionExplanations: {
      "add-producers": "Additional production increases backlog pressure.",
    },
    hiddenEvidence: ["Retry volume grows faster than original message volume."],
  },
  {
    scenarioId: "scenario-memory-pressure-003",
    rootCauseSummary:
      "The image-processing service retains buffers across completed jobs.",
    validCorrectiveActions: [
      "Roll back the faulty worker version",
      "Recycle workers while controlling intake",
    ],
    incorrectActionExplanations: {
      "increase-timeout": "Timeouts do not address retained memory.",
    },
    hiddenEvidence: ["Heap retention tracks completed image count."],
  },
  {
    scenarioId: "scenario-auth-storm-004",
    rootCauseSummary:
      "Simulated distributed credential-stuffing-like traffic is exhausting defensive rate-limit capacity.",
    validCorrectiveActions: [
      "Tighten defensive adaptive limits",
      "Protect legitimate flows with safe controls",
    ],
    incorrectActionExplanations: {
      "disable-authentication":
        "Disabling authentication is unsafe and outside the exercise.",
    },
    hiddenEvidence: [
      "Failure distribution spans many simulated source identities.",
    ],
  },
  {
    scenarioId: "scenario-cascading-checkout-005",
    rootCauseSummary:
      "Payment degradation is amplified by synchronized upstream retries.",
    validCorrectiveActions: [
      "Limit retries and shed nonessential load",
      "Isolate the degraded payment path",
    ],
    incorrectActionExplanations: {
      "raise-all-timeouts":
        "Longer waits increase resource occupancy and blast radius.",
    },
    hiddenEvidence: ["Retry spans outnumber original checkout spans."],
  },
] as const;
