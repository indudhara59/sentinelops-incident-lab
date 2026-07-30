"use client";

import { createLocalSessionId, saveLocalSession } from "@/lib/local-session";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

export function StartInvestigation({
  scenarioSlug,
  ready,
}: {
  scenarioSlug: string;
  ready: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const start = () => {
    setStarting(true);
    setError("");
    try {
      const sessionId = createLocalSessionId();
      saveLocalSession(sessionId, scenarioSlug);
      router.push(
        `/operations/${sessionId}?scenario=${encodeURIComponent(scenarioSlug)}`,
      );
    } catch {
      setError("A secure local session could not be created in this browser.");
      setStarting(false);
    }
  };

  if (!ready)
    return (
      <div className="start-unavailable">
        <strong>Simulation engine not available yet</strong>
        <span>
          You can review this briefing while the scenario remains in preview.
        </span>
      </div>
    );
  return (
    <div>
      <button
        className="button start-button"
        type="button"
        onClick={start}
        disabled={starting || !hydrated}
      >
        {starting ? (
          <>
            <LoaderCircle className="spin" size={17} /> Creating local session…
          </>
        ) : (
          <>
            Start Investigation <ArrowRight size={17} />
          </>
        )}
      </button>
      <p className="session-note">
        Creates a temporary, tab-local Phase 2 session. It is not sent to a
        server or durably persisted.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
