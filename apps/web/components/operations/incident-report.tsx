"use client";

import {
  fetchReport,
  reportUrl,
  type IncidentReport,
} from "@/lib/simulation/api-client";
import { replayReport } from "@/lib/simulation/replay";
import { loadLocalSession } from "@/lib/local-session";
import { Download, Printer, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

export function IncidentReportPage({ sessionId }: { sessionId: string }) {
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [error, setError] = useState("");
  const [replay, setReplay] = useState<ReturnType<typeof replayReport> | null>(
    null,
  );
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const recordRaw = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem(`sentinelops:${sessionId}`),
    () => null,
  );
  const valid = Boolean(
    recordRaw && loadLocalSession(sessionId)?.execution === "api",
  );

  useEffect(() => {
    if (!valid) return;
    let active = true;
    void fetchReport(sessionId)
      .then((value) => {
        if (active) setReport(value);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "The report could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [sessionId, valid]);

  if (!hydrated)
    return (
      <ReportMessage
        title="Preparing report"
        text="Validating the ephemeral session…"
      />
    );
  if (!valid)
    return (
      <ReportMessage
        title="Report unavailable"
        text="This report requires the originating ephemeral API session in this tab."
      />
    );
  if (error) return <ReportMessage title="Report not ready" text={error} />;
  if (!report)
    return (
      <ReportMessage
        title="Preparing report"
        text="Loading the deterministic incident record…"
      />
    );

  return (
    <main id="main-content" className="incident-report">
      <header className="report-header">
        <div>
          <span>POST-INCIDENT REPORT · SIMULATED</span>
          <h1>{report.scenario.title}</h1>
          <p>{report.disclaimer}</p>
        </div>
        <div className="report-actions no-print">
          <a href={reportUrl(sessionId, "report.json")} download>
            <Download size={15} /> JSON report
          </a>
          <a href={reportUrl(sessionId, "timeline.csv")} download>
            <Download size={15} /> CSV timeline
          </a>
          <button type="button" onClick={() => window.print()}>
            <Printer size={15} /> Print report
          </button>
        </div>
      </header>

      <section
        className="report-score"
        aria-label="Overall investigation score"
      >
        <strong>{report.score.total}</strong>
        <span>of {report.score.maximum}</span>
        <p>Evidence-based investigation quality</p>
      </section>
      <ReportSection title="Executive summary">
        <p>{report.executiveSummary}</p>
      </ReportSection>
      <ReportSection title="Customer impact">
        <p>{report.customerImpact}</p>
      </ReportSection>
      <ReportSection title="Root cause">
        <p>{report.rootCause}</p>
      </ReportSection>
      <ReportSection title="Contributing factors">
        <StringList items={report.contributingFactors} />
      </ReportSection>
      <ReportSection title="Score breakdown">
        <div className="score-breakdown">
          {report.score.breakdown.map((item) => (
            <article key={item.category}>
              <strong>{item.category}</strong>
              <b>
                {item.score}/{item.maximum}
              </b>
              <p>{item.explanation}</p>
            </article>
          ))}
        </div>
      </ReportSection>
      <RecordSection title="Incident timeline" records={report.timeline} />
      <RecordSection title="Alerts" records={report.alerts} />
      <RecordSection title="Evidence collected" records={report.evidence} />
      <RecordSection
        title="Hypotheses considered"
        records={report.hypotheses}
      />
      <RecordSection title="Actions taken" records={report.actions} />
      <ReportSection title="Recovery verification">
        <ul>
          {Object.entries(report.recoveryVerification.checks).map(
            ([name, passed]) => (
              <li key={name}>
                {humanize(name)}: {passed ? "Verified" : "Not verified"}
              </li>
            ),
          )}
        </ul>
      </ReportSection>
      <ReportSection title="Missed evidence">
        {report.missedEvidence.length ? (
          <StringList items={report.missedEvidence} />
        ) : (
          <p>No required source category was missed.</p>
        )}
      </ReportSection>
      <ReportSection title="Better investigation path">
        <StringList items={report.betterInvestigationPath} ordered />
      </ReportSection>
      <ReportSection title="Lessons learned">
        <StringList items={report.lessonsLearned} />
      </ReportSection>
      <ReportSection title="Follow-up actions">
        <StringList items={report.followUpActions} />
      </ReportSection>

      <section className="report-section no-print">
        <h2>Deterministic replay</h2>
        <p>
          Replay uses the recorded scenario version, seed, engine version,
          actions, and simulated timestamps.
        </p>
        <button type="button" onClick={() => setReplay(replayReport(report))}>
          <RotateCcw size={15} /> Replay locally
        </button>
        {replay && (
          <p
            role="status"
            className={replay.exact ? "replay-ok" : "replay-warning"}
          >
            {replay.warning ??
              `Exact replay reconstructed ${replay.state.actions.length} actions through T+${replay.state.elapsedSeconds}s.`}
          </p>
        )}
      </section>
      <footer className="report-footer no-print">
        <Link
          href={`/operations/${sessionId}?scenario=${report.scenario.slug}`}
        >
          Return to investigation workspace
        </Link>
      </footer>
    </main>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="report-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function RecordSection({
  title,
  records,
}: {
  title: string;
  records: Array<Record<string, unknown>>;
}) {
  return (
    <ReportSection title={title}>
      {records.length ? (
        <div className="report-records">
          {records.map((record, index) => (
            <article key={String(record.id ?? index)}>
              <strong>
                {String(
                  record.title ??
                    record.summary ??
                    record.label ??
                    record.source ??
                    `Record ${index + 1}`,
                )}
              </strong>
              <span>
                {record.second !== undefined
                  ? `T+${String(record.second)}s`
                  : String(record.timestamp ?? "")}
              </span>
              <p>
                {String(
                  record.description ??
                    record.notes ??
                    record.effect ??
                    record.service ??
                    "",
                )}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p>None recorded.</p>
      )}
    </ReportSection>
  );
}
function StringList({
  items,
  ordered = false,
}: {
  items: string[];
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Tag>
  );
}
function ReportMessage({ title, text }: { title: string; text: string }) {
  return (
    <main id="main-content" className="invalid-session">
      <h1>{title}</h1>
      <p>{text}</p>
      <Link href="/scenarios">Return to scenarios</Link>
    </main>
  );
}
function humanize(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
