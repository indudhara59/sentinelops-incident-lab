"use client";

import type {
  CompletionDocumentation,
  RootCauseSubmission,
  SimulationEvent,
  SimulationState,
} from "@/lib/simulation/types";
import { CheckCircle2, ClipboardCheck, FileCheck2 } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

const conclusionOptions: Record<
  string,
  {
    services: string[];
    mechanisms: string[];
    triggers: string[];
    mitigations: string[];
  }
> = {
  "scenario-midnight-latency-001": {
    services: [
      "api-gateway",
      "order-service",
      "orders-database",
      "payment-service",
    ],
    mechanisms: [
      "database-connections-not-released",
      "slow-database-queries",
      "traffic-capacity-shortfall",
      "payment-provider-latency",
    ],
    triggers: [
      "order-service-2.14.7-deployment",
      "traffic-increase",
      "database-maintenance",
      "no-recent-change",
    ],
    mitigations: [
      "rollback-order-service-2.14.7",
      "restart-order-service",
      "scale-order-service",
      "increase-database-pool",
      "continue-observing",
    ],
  },
  "scenario-queue-breaking-point-002": {
    services: [
      "notification-consumer",
      "delivery-queue",
      "notification-api",
      "provider-gateway",
    ],
    mechanisms: [
      "retry-amplification",
      "producer-traffic-spike",
      "provider-outage",
      "template-cpu-saturation",
    ],
    triggers: [
      "consumer-version-4.8.0",
      "traffic-increase",
      "provider-change",
      "no-recent-change",
    ],
    mitigations: [
      "disable-consumer-retries",
      "rollback-consumer",
      "scale-consumers",
      "pause-consumer",
      "continue-observing",
    ],
  },
  "scenario-memory-pressure-003": {
    services: ["image-worker", "job-queue", "upload-api", "object-store"],
    mechanisms: [
      "retained-image-buffers",
      "queue-overload",
      "storage-latency",
      "capacity-shortfall",
    ],
    triggers: [
      "image-worker-3.3.1",
      "traffic-increase",
      "storage-change",
      "no-recent-change",
    ],
    mitigations: [
      "rollback-image-worker",
      "restart-workers",
      "scale-workers",
      "pause-intake",
      "continue-observing",
    ],
  },
  "scenario-auth-storm-004": {
    services: [
      "auth-service",
      "auth-gateway",
      "identity-database",
      "risk-engine",
    ],
    mechanisms: [
      "credential-stuffing-simulation",
      "deployment-regression",
      "identity-database-outage",
      "legitimate-traffic-spike",
    ],
    triggers: [
      "distributed-sign-in-burst",
      "auth-deployment",
      "database-maintenance",
      "no-recent-change",
    ],
    mitigations: [
      "enable-adaptive-rate-limits",
      "scale-auth-service",
      "disable-authentication",
      "continue-observing",
    ],
  },
  "scenario-cascading-checkout-005": {
    services: [
      "payment-service",
      "checkout-api",
      "order-service",
      "orders-database",
    ],
    mechanisms: [
      "synchronized-retry-amplification",
      "database-saturation",
      "deployment-regression",
      "traffic-capacity-shortfall",
    ],
    triggers: [
      "payment-service-degradation",
      "checkout-deployment",
      "traffic-increase",
      "database-maintenance",
    ],
    mitigations: [
      "disable-checkout-retries",
      "scale-checkout",
      "restart-payment-service",
      "continue-observing",
    ],
  },
};

function optionPairs(
  placeholder: string,
  values: string[],
): Array<[string, string]> {
  return [
    ["", placeholder],
    ...values.map(
      (value) =>
        [
          value,
          value
            .split("-")
            .map((part) =>
              part ? `${part[0]!.toUpperCase()}${part.slice(1)}` : part,
            )
            .join(" "),
        ] as [string, string],
    ),
  ];
}

export function CompletionPanel({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
}) {
  const pathname = usePathname();
  const choices =
    conclusionOptions[state.scenarioId] ??
    conclusionOptions["scenario-midnight-latency-001"]!;
  const [root, setRoot] = useState<RootCauseSubmission>({
    affected_service: "",
    failure_mechanism: "",
    triggering_change: "",
    supporting_evidence: [],
    rejected_alternatives: [],
    proposed_mitigation: "",
    confidence: 50,
  });
  const [recoveryEvidence, setRecoveryEvidence] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [documentation, setDocumentation] = useState<CompletionDocumentation>({
    incident_summary: "",
    customer_impact: "",
    lessons_learned: [],
    follow_up_actions: [],
  });
  const [lessons, setLessons] = useState("");
  const [followUps, setFollowUps] = useState("");

  const toggle = (
    values: string[],
    value: string,
    update: (items: string[]) => void,
  ) =>
    update(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );

  return (
    <div className="completion-workspace">
      <header>
        <ClipboardCheck size={20} />
        <div>
          <span>INCIDENT COMPLETION</span>
          <h2>Submit, verify, and document</h2>
          <p>
            Completion is evidence-gated. Exploring reasonable alternatives is
            not penalized; unsupported conclusions and risky repeated actions
            are treated separately.
          </p>
        </div>
      </header>

      <form
        className="completion-card"
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "SUBMIT_ROOT_CAUSE", submission: root });
        }}
      >
        <h3>1. Structured root-cause submission</h3>
        <div className="completion-grid">
          <SelectField
            label="Affected service"
            value={root.affected_service}
            options={optionPairs("Select a service", choices.services)}
            onChange={(value) => setRoot({ ...root, affected_service: value })}
          />
          <SelectField
            label="Failure mechanism"
            value={root.failure_mechanism}
            options={optionPairs("Select a mechanism", choices.mechanisms)}
            onChange={(value) => setRoot({ ...root, failure_mechanism: value })}
          />
          <SelectField
            label="Triggering change"
            value={root.triggering_change}
            options={optionPairs("Select a trigger", choices.triggers)}
            onChange={(value) => setRoot({ ...root, triggering_change: value })}
          />
          <SelectField
            label="Proposed mitigation"
            value={root.proposed_mitigation}
            options={optionPairs("Select a mitigation", choices.mitigations)}
            onChange={(value) =>
              setRoot({ ...root, proposed_mitigation: value })
            }
          />
        </div>
        <EvidenceChecks
          legend="Supporting evidence — select at least three across two sources"
          state={state}
          selected={root.supporting_evidence}
          onToggle={(id) =>
            toggle(root.supporting_evidence, id, (supporting_evidence) =>
              setRoot({ ...root, supporting_evidence }),
            )
          }
        />
        <label>
          Rejected alternatives, one per line
          <textarea
            value={root.rejected_alternatives.join("\n")}
            onChange={(event) =>
              setRoot({
                ...root,
                rejected_alternatives: event.target.value
                  .split("\n")
                  .map((value) => value.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Traffic surge — request rate remained stable"
          />
        </label>
        <label>
          Confidence: {root.confidence}%
          <input
            type="range"
            min="0"
            max="100"
            value={root.confidence}
            onChange={(event) =>
              setRoot({ ...root, confidence: Number(event.target.value) })
            }
          />
        </label>
        <button
          type="submit"
          disabled={
            !root.affected_service ||
            !root.failure_mechanism ||
            !root.triggering_change ||
            !root.proposed_mitigation ||
            root.supporting_evidence.length < 3
          }
        >
          Submit evidence-linked conclusion
        </button>
        {state.rootCauseSubmission && (
          <p className="completion-success">
            <CheckCircle2 size={15} /> Conclusion recorded. The hidden answer
            remains sealed until completion.
          </p>
        )}
      </form>

      <form
        className="completion-card"
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({
            type: "VERIFY_RECOVERY",
            evidenceIds: recoveryEvidence,
            observation,
          });
        }}
      >
        <h3>2. Verify stable recovery</h3>
        <p>
          The server checks this scenario&apos;s bounded recovery thresholds,
          successful traces, and a stable three-interval observation window.
        </p>
        <EvidenceChecks
          legend="Recovery evidence — link at least two items"
          state={state}
          selected={recoveryEvidence}
          onToggle={(id) => toggle(recoveryEvidence, id, setRecoveryEvidence)}
        />
        <label>
          Recovery observation
          <textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Describe the stable window and every signal checked…"
          />
        </label>
        <button
          type="submit"
          disabled={
            !state.rootCauseSubmission ||
            recoveryEvidence.length < 2 ||
            observation.trim().length < 20
          }
        >
          Verify recovery signals
        </button>
        {state.recoveryVerification?.verified && (
          <p className="completion-success">
            <CheckCircle2 size={15} /> Stable recovery verified.
          </p>
        )}
      </form>

      <form
        className="completion-card"
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({
            type: "COMPLETE_INCIDENT",
            documentation: {
              ...documentation,
              lessons_learned: lines(lessons),
              follow_up_actions: lines(followUps),
            },
          });
        }}
      >
        <h3>3. Incident documentation</h3>
        <label>
          Executive incident summary
          <textarea
            value={documentation.incident_summary}
            onChange={(event) =>
              setDocumentation({
                ...documentation,
                incident_summary: event.target.value,
              })
            }
          />
        </label>
        <label>
          Customer impact
          <textarea
            value={documentation.customer_impact}
            onChange={(event) =>
              setDocumentation({
                ...documentation,
                customer_impact: event.target.value,
              })
            }
          />
        </label>
        <label>
          Lessons learned, one per line
          <textarea
            value={lessons}
            onChange={(event) => setLessons(event.target.value)}
          />
        </label>
        <label>
          Follow-up actions, one per line
          <textarea
            value={followUps}
            onChange={(event) => setFollowUps(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={
            !state.recoveryVerification?.verified ||
            documentation.incident_summary.trim().length < 40 ||
            documentation.customer_impact.trim().length < 20 ||
            !lines(lessons).length ||
            !lines(followUps).length
          }
        >
          Complete incident and generate report
        </button>
        {state.investigationCompleted && (
          <a
            className="button report-link"
            href={`${pathname}/report?scenario=midnight-latency-incident`}
          >
            <FileCheck2 size={16} /> Open post-incident report
          </a>
        )}
      </form>
    </div>
  );
}

function EvidenceChecks({
  legend,
  state,
  selected,
  onToggle,
}: {
  legend: string;
  state: SimulationState;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="completion-evidence">
      <legend>{legend}</legend>
      {state.collectedEvidence.length ? (
        state.collectedEvidence.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span>
              <strong>{item.source}</strong> {item.summary}
            </span>
          </label>
        ))
      ) : (
        <p>Collect telemetry evidence before submitting a conclusion.</p>
      )}
    </fieldset>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, name]) => (
          <option value={optionValue} key={optionValue}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
