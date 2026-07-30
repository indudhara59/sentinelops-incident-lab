"use client";

import { createApiSession } from "@/lib/simulation/api-client";
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

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      let sessionId: string;
      let fallback = false;
      try {
        sessionId = (await createApiSession(scenarioSlug)).id;
        saveLocalSession(sessionId, scenarioSlug, sessionStorage, "api");
      } catch {
        sessionId = createLocalSessionId();
        fallback = true;
        saveLocalSession(
          sessionId,
          scenarioSlug,
          sessionStorage,
          "local-fallback",
        );
      }
      router.push(
        `/operations/${sessionId}?scenario=${encodeURIComponent(scenarioSlug)}${fallback ? "&fallback=local" : ""}`,
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
            <LoaderCircle className="spin" size={17} /> Creating simulation…
          </>
        ) : (
          <>
            Start Investigation <ArrowRight size={17} />
          </>
        )}
      </button>
      <p className="session-note">
        Creates an ephemeral API session. If the development API is unavailable,
        an explicitly labelled local educational fallback is used. Neither mode
        is durably persisted.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
