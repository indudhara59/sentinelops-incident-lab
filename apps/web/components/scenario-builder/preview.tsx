"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  generateScenarioPreview,
  validateScenarioDraft,
  type ScenarioDraft,
} from "@/lib/scenario-builder/schema";

export function ScenarioPreview({
  scenarioId,
  version,
  draft,
  archived,
}: {
  scenarioId: string;
  version: number;
  draft: ScenarioDraft;
  archived: boolean;
}) {
  const router = useRouter();
  const issues = validateScenarioDraft(draft);
  const preview = useMemo(
    () => (issues.length ? null : generateScenarioPreview(draft, 8_675_309)),
    [draft, issues.length],
  );
  const [run, setRun] = useState<unknown>(null);
  const [status, setStatus] = useState("");
  async function action(name: "test-run" | "duplicate" | "archive") {
    setStatus(`${name}…`);
    const response = await fetch(
      `/api/custom-scenarios/${scenarioId}/actions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: name, seed: 8_675_309 }),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error?.message ?? "Action failed.");
      return;
    }
    if (name === "test-run") {
      setRun(payload);
      setStatus(
        "Private deterministic test run generated. Nothing was persisted or sent to a network destination.",
      );
    }
    if (name === "duplicate")
      router.push(`/scenario-builder/${payload.scenarioId}/edit`);
    if (name === "archive") {
      setStatus("Scenario archived.");
      router.refresh();
    }
  }
  return (
    <div className="builder-preview">
      <section className="dashboard-card preview-warning">
        <strong>Private simulated preview</strong>
        <span>
          Version {version} · {archived ? "Archived" : "Active draft"}. No real
          services, hosts, credentials, or networks are used.
        </span>
      </section>
      {issues.length ? (
        <section className="dashboard-card">
          <h2>Validation failed</h2>
          <ul>
            {issues.map((issue, index) => (
              <li key={index}>
                {issue.path}: {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {preview ? (
        <>
          <section className="dashboard-card">
            <h2>Topology</h2>
            <div className="preview-topology">
              {preview.topology.map((service) => (
                <article key={service.id}>
                  <strong>{service.name}</strong>
                  <span>{service.type}</span>
                  <small>
                    Depends on: {service.dependencies.join(", ") || "none"}
                  </small>
                </article>
              ))}
            </div>
          </section>
          <section className="dashboard-card">
            <h2>Timeline</h2>
            <ol className="preview-timeline">
              {preview.timeline.map((event) => (
                <li key={event.id}>
                  <time>T+{event.atSeconds}s</time>
                  <strong>{event.title}</strong>
                  <span>{event.type}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="dashboard-card">
            <h2>Deterministic telemetry sample</h2>
            {preview.metrics.length ? (
              preview.metrics.map((series) => (
                <div key={series.id}>
                  <strong>
                    {series.metric} · {series.serviceId}
                  </strong>
                  <table className="history-table">
                    <thead>
                      <tr>
                        {series.points.map((point) => (
                          <th key={point.second}>T+{point.second}s</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {series.points.map((point) => (
                          <td key={point.second}>{point.value}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <p>No metric pattern configured.</p>
            )}
          </section>
        </>
      ) : null}
      <section className="dashboard-card">
        <h2>Owner actions</h2>
        <div className="inline-actions">
          <button
            className="button"
            disabled={Boolean(issues.length)}
            onClick={() => action("test-run")}
          >
            Run privately
          </button>
          <button
            className="button button-secondary"
            onClick={() => action("duplicate")}
          >
            Duplicate
          </button>
          <button
            className="button button-secondary"
            disabled={archived}
            onClick={() => action("archive")}
          >
            Archive
          </button>
        </div>
        <p role="status">{status}</p>
        {run ? (
          <details>
            <summary>Private test-run manifest</summary>
            <pre className="mono preview-manifest">
              {JSON.stringify(run, null, 2)}
            </pre>
          </details>
        ) : null}
      </section>
    </div>
  );
}
