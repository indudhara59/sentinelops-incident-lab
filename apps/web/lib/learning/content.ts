export const LEARNING_SLUGS = [
  "observability",
  "logs",
  "metrics",
  "traces",
  "alerts",
  "incident-triage",
  "root-cause-analysis",
  "mitigation",
  "post-incident-reviews",
  "opentelemetry",
  "sre-fundamentals",
  "glossary",
] as const;

export type LearningSlug = (typeof LEARNING_SLUGS)[number];

export type LearningTopic = {
  slug: LearningSlug;
  title: string;
  eyebrow: string;
  description: string;
  takeaways: string[];
  sections: Array<{
    title: string;
    paragraphs: string[];
    details?: { summary: string; body: string };
  }>;
  related: LearningSlug[];
};

const topics: LearningTopic[] = [
  {
    slug: "observability",
    title: "Observability as a way to ask questions",
    eyebrow: "FOUNDATIONS",
    description:
      "Use system outputs to investigate behavior you did not predict in advance.",
    takeaways: [
      "Telemetry is evidence, not a conclusion.",
      "Topology and change history give signals context.",
      "A useful investigation moves from customer impact toward narrower questions.",
    ],
    sections: [
      {
        title: "Beyond a wall of dashboards",
        paragraphs: [
          "Monitoring asks whether known conditions crossed a boundary. Observability supports broader questions about why a system is behaving differently, using outputs such as logs, metrics, and traces.",
          "No single signal is complete. A latency chart can establish when a symptom began; a trace can locate where request time accumulated; a correlated log can add event detail. Together they support a hypothesis, but they still do not prove causation on their own.",
        ],
        details: {
          summary: "Technical detail: instrumentation",
          body: "Instrumentation is the code or configuration that produces telemetry. Good instrumentation carries stable service identity, time, operation names, and correlation context while avoiding credentials and excessive-cardinality attributes.",
        },
      },
      {
        title: "Questions before queries",
        paragraphs: [
          "Begin with user impact, scope, and timing. Then ask which service-level indicator changed, which dependencies lie on the affected path, and what changed near the onset. This keeps exploration connected to the incident rather than to whichever dashboard looks dramatic.",
        ],
      },
    ],
    related: ["metrics", "logs", "traces", "opentelemetry"],
  },
  {
    slug: "logs",
    title: "Logs: event detail with context",
    eyebrow: "TELEMETRY SIGNAL",
    description:
      "Read structured event records safely and correlate them with requests and changes.",
    takeaways: [
      "Logs record discrete events; they are not aggregate trends.",
      "Time, service identity, trace IDs, and request IDs make correlation practical.",
      "Absence of a log is not proof that an event did not happen.",
    ],
    sections: [
      {
        title: "A record, not the whole story",
        paragraphs: [
          "A log record usually captures a timestamp, severity, message, resource identity, and structured attributes. Search for a bounded time window and affected service first, then follow identifiers rather than relying on vague text matches.",
          "Severity reflects the producer's classification. An ERROR can be handled safely, while a WARN repeated across every request can be the strongest clue. Judge a record by its relationship to impact and neighboring evidence.",
        ],
        details: {
          summary: "Technical detail: safe structured fields",
          body: "Prefer bounded fields such as service.name, deployment.version, trace_id, span_id, and request_id. Do not log secrets, access tokens, credentials, or unnecessary personal data.",
        },
      },
    ],
    related: ["traces", "observability", "opentelemetry"],
  },
  {
    slug: "metrics",
    title: "Metrics: shape, rate, and magnitude",
    eyebrow: "TELEMETRY SIGNAL",
    description:
      "Use aggregated measurements to establish impact, trends, saturation, and recovery.",
    takeaways: [
      "Rates need a denominator and a time window.",
      "Percentiles describe a distribution better than a lone average.",
      "High-cardinality labels can make metric systems expensive and misleading.",
    ],
    sections: [
      {
        title: "Read the axes before the incident",
        paragraphs: [
          "Confirm the unit, aggregation window, population, and service scope before interpreting a chart. Compare request rate, errors, and latency so a traffic surge is not confused with a service regression.",
          "Resource metrics such as CPU or memory can be causes, symptoms, or irrelevant coincidence. Service-level indicators closer to user experience usually establish impact more directly.",
        ],
        details: {
          summary: "Technical detail: latency percentiles",
          body: "A p99 latency value means roughly 99 percent of observed durations were at or below that value in the selected population and window. It does not identify which request was slow; use traces or logs for that detail.",
        },
      },
    ],
    related: ["alerts", "sre-fundamentals", "traces"],
  },
  {
    slug: "traces",
    title: "Traces: follow work across boundaries",
    eyebrow: "TELEMETRY SIGNAL",
    description:
      "Inspect request paths, parent-child spans, duration, errors, and waiting time.",
    takeaways: [
      "A trace represents one request or unit of work.",
      "The longest span is not automatically the root cause.",
      "Trace and span identifiers connect traces to relevant logs.",
    ],
    sections: [
      {
        title: "Find where time accumulated",
        paragraphs: [
          "Start with slow or failed traces that match the affected operation. Follow the critical path and compare healthy examples. A child span waiting on a database connection is evidence about where time was spent, not yet proof of why the pool was exhausted.",
          "Sampling means the trace list is a selected population. Use metrics to understand prevalence and traces to understand representative request structure.",
        ],
      },
    ],
    related: ["logs", "metrics", "root-cause-analysis"],
  },
  {
    slug: "alerts",
    title: "Alerts: prompts to investigate",
    eyebrow: "DETECTION",
    description:
      "Treat an alert as a notification about a condition, not a diagnosis.",
    takeaways: [
      "Acknowledge ownership without hiding underlying evidence.",
      "Connect alert thresholds to user impact and an actionable response.",
      "Correlated alerts may share one cause or merely share the same incident window.",
    ],
    sections: [
      {
        title: "Read condition, scope, and history",
        paragraphs: [
          "Check what expression fired, for which resource, over which window, and whether the condition is still active. Then confirm impact independently. Alert titles are summaries written before this specific incident existed.",
          "Silencing can reduce notification noise during coordinated response, but it must not erase telemetry or replace mitigation. Record acknowledgement, assignment, and silence actions in the timeline.",
        ],
      },
    ],
    related: ["incident-triage", "metrics", "mitigation"],
  },
  {
    slug: "incident-triage",
    title: "Incident triage: establish impact first",
    eyebrow: "RESPONSE PRACTICE",
    description:
      "Create a shared, evidence-backed picture of severity, scope, and ownership.",
    takeaways: [
      "Confirm affected users and critical journeys.",
      "Record the incident start as an estimate and refine it.",
      "Separate confirmed facts, hypotheses, and unanswered questions.",
    ],
    sections: [
      {
        title: "The first useful minutes",
        paragraphs: [
          "Name an incident commander, state the known impact, identify the affected journey, and open a timeline. Check recent changes and the service dependency path while responders inspect telemetry in parallel.",
          "Severity should reflect impact and urgency, not the number of alerts. Update it as evidence changes. A calm correction is healthier than defending the first estimate.",
        ],
      },
    ],
    related: ["alerts", "root-cause-analysis", "mitigation"],
  },
  {
    slug: "root-cause-analysis",
    title: "Root-cause analysis without premature certainty",
    eyebrow: "REASONING",
    description:
      "Build falsifiable hypotheses and distinguish correlation from causation.",
    takeaways: [
      "A symptom describes observed behavior; a cause explains the mechanism producing it.",
      "Temporal correlation is useful but insufficient by itself.",
      "Seek evidence that could contradict the leading hypothesis.",
    ],
    sections: [
      {
        title: "From observation to mechanism",
        paragraphs: [
          "Write a hypothesis as a mechanism with a predicted observation: if the deployment leaks connections, pool use should rise by version while request rate remains comparatively stable. Then test that prediction across metrics, traces, logs, and change history.",
          "Reasonable alternatives should not be penalized merely for being rejected. Document why traffic, database capacity, or an upstream dependency became less likely as evidence accumulated.",
        ],
        details: {
          summary: "Correlation versus causation",
          body: "Correlation identifies variables that move together. A causal claim also needs a credible mechanism, correct time ordering, evidence against alternatives, and ideally a controlled change or recovery response consistent with the hypothesis.",
        },
      },
    ],
    related: ["observability", "traces", "post-incident-reviews"],
  },
  {
    slug: "mitigation",
    title: "Mitigation: reduce harm safely",
    eyebrow: "RESPONSE PRACTICE",
    description:
      "Choose reversible actions that reduce impact while preserving a path to diagnosis.",
    takeaways: [
      "Mitigation reduces current impact; remediation removes the underlying defect.",
      "Temporary relief should be labeled and followed up.",
      "Every impactful action needs an expected benefit, risk, and verification plan.",
    ],
    sections: [
      {
        title: "Prefer the smallest safe change",
        paragraphs: [
          "A rollback can be safer than debugging live when impact began immediately after a compatible deployment. A restart or capacity increase may buy time, but can hide a leak or transfer risk to a dependency.",
          "Do not confuse action with recovery. Watch user-facing latency and success, the suspected saturation signal, and representative traces through a stable observation window.",
        ],
      },
    ],
    related: [
      "incident-triage",
      "root-cause-analysis",
      "post-incident-reviews",
    ],
  },
  {
    slug: "post-incident-reviews",
    title: "Post-incident reviews: learn without blame",
    eyebrow: "LEARNING PRACTICE",
    description:
      "Explain impact, conditions, decisions, and improvements without reducing an incident to individual fault.",
    takeaways: [
      "A timeline separates hindsight from what responders knew at the time.",
      "Contributing conditions matter alongside the triggering event.",
      "Follow-up actions need owners, priorities, and observable outcomes.",
    ],
    sections: [
      {
        title: "Accountable and blameless are compatible",
        paragraphs: [
          "Blameless analysis assumes people acted within the information, incentives, and safeguards available to them. It still examines decisions rigorously and assigns concrete improvement work.",
          "A useful review covers customer impact, detection, response, root cause, contributing factors, recovery verification, what went well, and what should change. Avoid counterfactual claims that rely on knowledge responders did not yet have.",
        ],
      },
    ],
    related: ["mitigation", "sre-fundamentals", "root-cause-analysis"],
  },
  {
    slug: "opentelemetry",
    title: "OpenTelemetry: portable telemetry concepts",
    eyebrow: "OPEN STANDARD",
    description:
      "Understand resources, signals, context propagation, semantic conventions, and OTLP.",
    takeaways: [
      "OpenTelemetry generates, collects, and exports telemetry; it is not an observability backend.",
      "Resource attributes describe the entity producing telemetry.",
      "Trace context enables precise correlation across signals.",
    ],
    sections: [
      {
        title: "One vocabulary across tools",
        paragraphs: [
          "OpenTelemetry provides APIs, SDKs, semantic conventions, a protocol, and a Collector ecosystem for traces, metrics, and logs. A backend still stores, queries, and visualizes the data.",
          "Consistent service identity and trace context let an investigation move from a slow span to correlated log records. Semantic conventions reduce naming drift, while teams still need thoughtful instrumentation and data-governance choices.",
        ],
        details: {
          summary: "Technical detail: resource and span attributes",
          body: "A resource describes the telemetry producer, such as service.name and deployment.environment.name. Span attributes describe a particular operation. Avoid putting unbounded request values into metric attributes or sensitive values into any signal.",
        },
      },
    ],
    related: ["observability", "logs", "metrics", "traces"],
  },
  {
    slug: "sre-fundamentals",
    title: "SRE fundamentals: reliability as user experience",
    eyebrow: "RELIABILITY",
    description:
      "Connect service-level indicators, objectives, error budgets, toil, and learning.",
    takeaways: [
      "Reliability is behavior users can depend on, not merely process uptime.",
      "An SLI measures behavior; an SLO defines a target for that measure.",
      "Error budgets make reliability and delivery trade-offs explicit.",
    ],
    sections: [
      {
        title: "Measure what users need",
        paragraphs: [
          "Choose service-level indicators around meaningful journeys such as successful checkout latency, not only host health. An objective defines the acceptable level over a window; the remaining error budget expresses how much unreliability the service can tolerate.",
          "Incident response is one reliability practice among design, capacity planning, change management, automation, and post-incident learning. A fast response cannot compensate indefinitely for unsafe systems.",
        ],
      },
    ],
    related: ["metrics", "post-incident-reviews", "observability"],
  },
  {
    slug: "glossary",
    title: "Incident response glossary",
    eyebrow: "REFERENCE",
    description:
      "A shared vocabulary for observability, reliability, and simulated response.",
    takeaways: [],
    sections: [],
    related: ["observability", "opentelemetry", "sre-fundamentals"],
  },
];

export const LEARNING_TOPICS = topics;

export function getLearningTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export const GLOSSARY = [
  [
    "alert",
    "A notification that an observed condition crossed a configured rule.",
  ],
  [
    "causation",
    "A relationship where a mechanism produces an observed effect.",
  ],
  [
    "correlation",
    "A relationship in which observations vary together; it does not alone prove cause.",
  ],
  [
    "evidence",
    "A recorded observation with source, time, scope, and relevant fields.",
  ],
  [
    "hypothesis",
    "A testable proposed explanation that predicts observable evidence.",
  ],
  ["log record", "A timestamped record of a discrete event and its context."],
  [
    "metric",
    "A numeric measurement aggregated or observed over time with bounded dimensions.",
  ],
  ["mitigation", "An action intended to reduce current incident impact."],
  [
    "remediation",
    "A change intended to remove or prevent the underlying failure mechanism.",
  ],
  ["resource", "The entity producing telemetry, such as a service instance."],
  [
    "root cause",
    "The failure mechanism and conditions that explain the incident.",
  ],
  [
    "service-level indicator",
    "A quantitative measure of service behavior relevant to users.",
  ],
  [
    "service-level objective",
    "A target level for an SLI over a defined window.",
  ],
  [
    "span",
    "A timed operation within a trace, including parent context and attributes.",
  ],
  [
    "symptom",
    "An observed effect of a problem, such as elevated latency or errors.",
  ],
  [
    "trace",
    "A representation of one request or unit of work across operations and services.",
  ],
] as const;

export type CourseStep = {
  id: string;
  number: number;
  title: string;
  summary: string;
  lesson: string;
  topic: LearningSlug;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  lab?: { label: string; href: string };
};

export const COURSE_STEPS: CourseStep[] = [
  [
    "system",
    "Understand the fictional system",
    "Map the checkout path before interpreting signals.",
    "Identify the user journey, service boundaries, dependencies, and expected healthy behavior. Topology narrows which telemetry is relevant without deciding the cause.",
    "observability",
    "What should you establish first?",
    [
      "The checkout path and expected behavior",
      "The eventual root cause",
      "Which service to restart",
    ],
    0,
    "A system map establishes context. Choosing a cause or action before evidence creates anchoring bias.",
  ],
  [
    "alert",
    "Read the first alert",
    "Treat the page as a prompt, not a diagnosis.",
    "Read severity, condition, source, time window, and current status. Acknowledge ownership, then confirm the alert against customer-facing signals.",
    "alerts",
    "What does a latency alert prove?",
    [
      "A deployment is faulty",
      "Its configured condition fired",
      "The database is saturated",
    ],
    1,
    "An alert proves only that its rule evaluated as firing for the stated scope and window.",
  ],
  [
    "impact",
    "Establish impact",
    "Define who is affected and how severely.",
    "Use successful checkout rate and latency to estimate scope. State confirmed impact separately from suspected mechanisms and revise severity when evidence changes.",
    "incident-triage",
    "Which is the best impact statement?",
    [
      "Order service looks odd",
      "Some logs are errors",
      "Checkout failures affect a measured share of attempts",
    ],
    2,
    "Impact should describe a user-visible journey, scope, and measured behavior.",
  ],
  [
    "metrics",
    "Inspect service-level metrics",
    "Compare rate, errors, latency, and saturation.",
    "Start with the affected journey, align time windows, and compare request volume with latency and error changes. Then inspect dependency saturation signals.",
    "metrics",
    "Why compare request rate with latency?",
    [
      "To test whether load explains the change",
      "To obtain a trace ID",
      "To silence alerts",
    ],
    0,
    "Stable traffic with rising latency makes a pure traffic-surge hypothesis less likely.",
  ],
  [
    "correlate",
    "Correlate logs and traces",
    "Move from aggregate shape to request detail.",
    "Choose a representative slow trace, locate where duration accumulated, and use trace or request IDs to inspect related structured logs.",
    "traces",
    "A database-wait span establishes what?",
    [
      "Where request time accumulated",
      "Why connections were unavailable",
      "That rollback is safe",
    ],
    0,
    "The span locates waiting time. The mechanism behind connection scarcity still needs evidence.",
  ],
  [
    "deployments",
    "Check recent deployments",
    "Compare change timing and version-specific behavior.",
    "Review changes near incident onset and compare old and new versions. Time correlation raises a hypothesis; it does not prove that the change caused impact.",
    "root-cause-analysis",
    "A deployment completed before latency rose. What next?",
    [
      "Declare it the cause",
      "Test version-specific predictions and alternatives",
      "Ignore it as coincidence",
    ],
    1,
    "A correlated change is worth testing with mechanism-based predictions and disconfirming evidence.",
  ],
  [
    "hypotheses",
    "Build evidence-based hypotheses",
    "Write mechanisms that can be contradicted.",
    "Link each hypothesis to supporting evidence, predictions, and plausible alternatives. Record uncertainty rather than converting confidence into fact.",
    "root-cause-analysis",
    "Which hypothesis is most testable?",
    [
      "The system is broken",
      "Connections are not released after requests, so pool use should rise by deployed version",
      "It feels like the database",
    ],
    1,
    "The second statement names a mechanism and a predicted observation that evidence can support or contradict.",
  ],
  [
    "mitigation",
    "Choose a safe mitigation",
    "Reduce impact with the smallest reversible action.",
    "Compare expected benefit, blast radius, reversibility, and dependency risk. Label restarts or capacity increases as temporary when they do not remove the mechanism.",
    "mitigation",
    "What distinguishes mitigation from remediation?",
    [
      "Mitigation reduces current harm; remediation removes or prevents the defect",
      "Mitigation is always permanent",
      "Remediation happens before impact",
    ],
    0,
    "Mitigation restores service safely; permanent remediation may follow after deeper analysis and testing.",
  ],
  [
    "recovery",
    "Verify recovery",
    "Observe user and mechanism signals through a stable window.",
    "After action, confirm latency, errors, saturation, and successful representative traces. Recovery is a measured state, not the absence of a firing notification.",
    "metrics",
    "When is recovery verified?",
    [
      "Immediately after clicking rollback",
      "When one alert is silenced",
      "When user and mechanism signals remain healthy across the observation window",
    ],
    2,
    "Multiple relevant signals must remain healthy long enough to detect a temporary dip or delayed recurrence.",
  ],
  [
    "report",
    "Write a post-incident report",
    "Preserve decisions, context, and follow-up learning.",
    "Write customer impact, a factual timeline, cause and contributing factors, actions, recovery evidence, and owned improvements. Analyze system conditions without assigning personal blame.",
    "post-incident-reviews",
    "What belongs in a useful review?",
    [
      "Only the name of the person who deployed",
      "Impact, timeline, evidence, contributing conditions, recovery, and follow-ups",
      "A claim that the incident was unavoidable",
    ],
    1,
    "A review should make the system and response easier to improve, with concrete follow-up ownership and observable outcomes.",
  ],
].map((values, index) => {
  const [
    id,
    title,
    summary,
    lesson,
    topic,
    question,
    options,
    answer,
    explanation,
  ] = values as [
    string,
    string,
    string,
    string,
    LearningSlug,
    string,
    string[],
    number,
    string,
  ];
  return {
    id,
    number: index + 1,
    title,
    summary,
    lesson,
    topic,
    question,
    options,
    answer,
    explanation,
    ...(index === 3
      ? {
          lab: {
            label: "Launch metrics investigation lab",
            href: "/scenarios/midnight-latency-incident/briefing?learningStep=metrics",
          },
        }
      : {}),
  };
});
