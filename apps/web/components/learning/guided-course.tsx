"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { COURSE_STEPS } from "@/lib/learning/content";
import {
  COURSE_VERSION,
  LOCAL_PROGRESS_KEY,
  emptyProgress,
  sanitizeProgress,
  type LearningProgress,
} from "@/lib/learning/progress";

const stepIds = COURSE_STEPS.map((step) => step.id);

export function GuidedCourse() {
  const [progress, setProgress] = useState<LearningProgress>(() =>
    emptyProgress(),
  );
  const [mode, setMode] = useState<"loading" | "account" | "guest">("loading");
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepIndex = Math.max(
    0,
    COURSE_STEPS.findIndex((step) => step.id === progress.currentStepId),
  );
  const step = COURSE_STEPS[stepIndex]!;
  const percent = Math.round(
    (progress.completedStepIds.length / COURSE_STEPS.length) * 100,
  );

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/learning-progress");
        if (response.ok) {
          const remote = sanitizeProgress(await response.json(), stepIds);
          if (active) {
            setProgress(remote);
            setMode("account");
          }
          return;
        }
      } catch {
        // A guest or unavailable persistence safely falls back to this browser.
      }
      const local = localStorage.getItem(LOCAL_PROGRESS_KEY);
      let parsed: unknown = null;
      try {
        parsed = local ? JSON.parse(local) : null;
      } catch {
        localStorage.removeItem(LOCAL_PROGRESS_KEY);
      }
      if (active) {
        setProgress(sanitizeProgress(parsed, stepIds));
        setMode("guest");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function persist(next: LearningProgress) {
    setProgress(next);
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(next));
    if (mode === "account") {
      try {
        const response = await fetch("/api/learning-progress", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!response.ok) setMode("guest");
      } catch {
        setMode("guest");
      }
    }
  }

  function moveTo(id: string) {
    setSelected(null);
    setAnswered(false);
    void persist({ ...progress, currentStepId: id });
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function submitAnswer() {
    if (selected === null) return;
    setAnswered(true);
    if (selected !== step.answer) return;
    const completedStepIds = progress.completedStepIds.includes(step.id)
      ? progress.completedStepIds
      : [...progress.completedStepIds, step.id];
    void persist({
      courseVersion: COURSE_VERSION,
      completedStepIds,
      currentStepId: step.id,
      updatedAt: new Date().toISOString(),
    });
  }

  function reset() {
    if (!window.confirm("Reset all learning progress for this course?")) return;
    setSelected(null);
    setAnswered(false);
    void persist({ ...emptyProgress(), updatedAt: new Date().toISOString() });
  }

  const status = useMemo(() => {
    if (mode === "loading") return "Loading progress…";
    if (mode === "account") return "Progress saved to your account";
    return "Guest progress saved in this browser";
  }, [mode]);

  return (
    <section className="course-shell" aria-labelledby="course-title">
      <div className="course-heading">
        <div>
          <span className="eyebrow">GUIDED COURSE · 10 STEPS</span>
          <h2 id="course-title">Incident response foundations</h2>
          <p>{status}. No certificate or employment assessment is issued.</p>
        </div>
        <button className="button button-ghost" type="button" onClick={reset}>
          <RotateCcw size={16} aria-hidden="true" /> Reset progress
        </button>
      </div>
      <div className="course-progress">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Course completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <span>{progress.completedStepIds.length} of 10 complete</span>
      </div>
      <div className="course-layout">
        <nav className="course-steps" aria-label="Course steps">
          {COURSE_STEPS.map((item) => {
            const complete = progress.completedStepIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-current={item.id === step.id ? "step" : undefined}
                onClick={() => moveTo(item.id)}
              >
                <span>{complete ? <Check size={15} /> : item.number}</span>
                {item.title}
              </button>
            );
          })}
        </nav>
        <article className="course-lesson">
          <span className="eyebrow">STEP {step.number} OF 10</span>
          <h3 ref={headingRef} tabIndex={-1}>
            {step.title}
          </h3>
          <p className="lesson-summary">{step.summary}</p>
          <p>{step.lesson}</p>
          <p>
            <Link href={`/learn/${step.topic}`}>Read the topic guide</Link>
            {" · "}
            <Link href="/learn/glossary">Open the glossary</Link>
          </p>
          {step.lab && (
            <Link className="button button-ghost lab-link" href={step.lab.href}>
              {step.lab.label}
            </Link>
          )}
          <fieldset className="knowledge-check">
            <legend>Knowledge check: {step.question}</legend>
            {step.options.map((option, index) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`answer-${step.id}`}
                  checked={selected === index}
                  onChange={() => {
                    setSelected(index);
                    setAnswered(false);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
            <button
              className="button"
              type="button"
              disabled={selected === null}
              onClick={submitAnswer}
            >
              Check answer
            </button>
          </fieldset>
          {answered && selected !== null && (
            <div
              className={`answer-explanation ${selected === step.answer ? "correct" : "incorrect"}`}
              role="status"
            >
              <strong>
                {selected === step.answer
                  ? "Correct — step complete."
                  : "Not quite — review the explanation."}
              </strong>
              <p>{step.explanation}</p>
              {selected === step.answer &&
                stepIndex < COURSE_STEPS.length - 1 && (
                  <button
                    className="button button-small"
                    type="button"
                    onClick={() => moveTo(COURSE_STEPS[stepIndex + 1]!.id)}
                  >
                    Continue to next step
                  </button>
                )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
