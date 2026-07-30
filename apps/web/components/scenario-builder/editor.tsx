"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_SCENARIO_DRAFT,
  validateScenarioDraft,
  type ScenarioDraft,
} from "@/lib/scenario-builder/schema";

export function ScenarioEditor({
  scenarioId,
  initial = EMPTY_SCENARIO_DRAFT,
}: {
  scenarioId?: string;
  initial?: ScenarioDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [definition, setDefinition] = useState(
    JSON.stringify(initial, null, 2),
  );
  const [parseError, setParseError] = useState("");
  const [status, setStatus] = useState("");
  const issues = useMemo(() => validateScenarioDraft(draft), [draft]);

  function updateDefinition(value: string) {
    setDefinition(value);
    try {
      const parsed = JSON.parse(value) as ScenarioDraft;
      setDraft(parsed);
      setParseError("");
    } catch {
      setParseError(
        "Definition must be valid JSON. JSON is data only and never executed.",
      );
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (parseError) return;
    setStatus("Saving private draft…");
    const response = await fetch(
      scenarioId
        ? `/api/custom-scenarios/${scenarioId}`
        : "/api/custom-scenarios",
      {
        method: scenarioId ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft }),
      },
    );
    const payload = (await response.json()) as {
      scenarioId?: string;
      error?: { message?: string };
    };
    if (!response.ok || !payload.scenarioId) {
      setStatus(payload.error?.message ?? "Draft could not be saved.");
      return;
    }
    setStatus("Private draft saved.");
    router.push(`/scenario-builder/${payload.scenarioId}/preview`);
    router.refresh();
  }

  return (
    <form className="builder-editor" onSubmit={save}>
      <section className="dashboard-card builder-basics">
        <h2>Scenario basics</h2>
        <label>
          Title
          <input
            value={draft.title}
            maxLength={160}
            onChange={(event) => {
              const next = { ...draft, title: event.target.value };
              setDraft(next);
              setDefinition(JSON.stringify(next, null, 2));
            }}
          />
        </label>
        <label>
          Description
          <textarea
            value={draft.description}
            maxLength={2_000}
            onChange={(event) => {
              const next = { ...draft, description: event.target.value };
              setDraft(next);
              setDefinition(JSON.stringify(next, null, 2));
            }}
          />
        </label>
        <label>
          Difficulty
          <select
            value={draft.difficulty}
            onChange={(event) => {
              const next = {
                ...draft,
                difficulty: event.target.value as ScenarioDraft["difficulty"],
              };
              setDraft(next);
              setDefinition(JSON.stringify(next, null, 2));
            }}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>
      </section>
      <section className="dashboard-card">
        <h2>Declarative definition</h2>
        <p>
          Configure services and dependencies, initial conditions, timeline
          events, metric patterns, safe logs, traces, alerts, hidden truth,
          evidence, hypotheses, simulated actions, recovery conditions, scoring
          weights, and learning objectives. Only the documented JSON fields and
          allowlisted types are accepted.
        </p>
        <label className="definition-label">
          Scenario JSON
          <textarea
            className="definition-editor mono"
            value={definition}
            spellCheck={false}
            onChange={(event) => updateDefinition(event.target.value)}
          />
        </label>
        {parseError ? (
          <p className="form-error" role="alert">
            {parseError}
          </p>
        ) : null}
      </section>
      <section className="dashboard-card validation-panel" aria-live="polite">
        <h2>Validation</h2>
        {issues.length ? (
          <>
            <p>
              {issues.length} issue{issues.length === 1 ? "" : "s"} must be
              addressed before a private test run.
            </p>
            <ul>
              {issues.map((issue, index) => (
                <li key={`${issue.path}-${issue.code}-${index}`}>
                  <code>{issue.path}</code> — {issue.message}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="completion-success">
            Definition is valid and ready for a private test run.
          </p>
        )}
      </section>
      <div className="inline-actions">
        <button className="button" type="submit">
          Save private draft
        </button>
        <span role="status">{status}</span>
      </div>
    </form>
  );
}
