"use client";

import { useState, type FormEvent } from "react";

type SettingsValues = {
  displayName: string;
  theme: "system" | "light" | "dark";
  reducedMotion: boolean;
  defaultSimulationSpeed: 0.5 | 1 | 2 | 4;
  telemetryDensity: "compact" | "comfortable";
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: data.get("displayName"),
        theme: data.get("theme"),
        reducedMotion: data.get("reducedMotion") === "on",
        defaultSimulationSpeed: Number(data.get("defaultSimulationSpeed")),
        telemetryDensity: data.get("telemetryDensity"),
      }),
    });
    setSaving(false);
    setStatus(response.ok ? "Settings saved." : "Settings could not be saved.");
  }

  return (
    <form className="settings-form" onSubmit={submit}>
      <label>
        Display name
        <input
          name="displayName"
          defaultValue={initial.displayName}
          maxLength={80}
          required
        />
      </label>
      <label>
        Theme
        <select name="theme" defaultValue={initial.theme}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        Default simulation speed
        <select
          name="defaultSimulationSpeed"
          defaultValue={initial.defaultSimulationSpeed}
        >
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="4">4×</option>
        </select>
      </label>
      <label>
        Telemetry density
        <select name="telemetryDensity" defaultValue={initial.telemetryDensity}>
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="reducedMotion"
          defaultChecked={initial.reducedMotion}
        />{" "}
        Reduce nonessential motion
      </label>
      <button className="button" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </button>
      <p role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
