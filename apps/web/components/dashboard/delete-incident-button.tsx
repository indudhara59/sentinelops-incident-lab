"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteIncidentButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/incidents/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-confirm-delete": "delete" },
    });
    setBusy(false);
    if (!response.ok) {
      setError("The investigation could not be deleted.");
      return;
    }
    router.push("/dashboard/incidents");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        className="button button-danger"
        type="button"
        onClick={() => setConfirming(true)}
      >
        Delete investigation
      </button>
    );
  }
  return (
    <div className="delete-confirmation" role="alert">
      <p>
        Delete this saved investigation and its report, evidence, and
        hypotheses?
      </p>
      <div className="inline-actions">
        <button
          className="button button-danger"
          type="button"
          disabled={busy}
          onClick={remove}
        >
          {busy ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
      {error ? <p>{error}</p> : null}
    </div>
  );
}
