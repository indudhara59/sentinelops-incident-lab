/* eslint-disable react-hooks/error-boundaries -- persistence failures render an explicit availability state */
import { DatabaseUnavailable } from "@/components/dashboard/database-state";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { requireOwner } from "@/lib/auth/guards";
import {
  accountStorageSummary,
  DEFAULT_PREFERENCES,
  getOwnedPreferences,
} from "@/lib/persistence/preferences";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireOwner("/settings");
  let content: React.ReactNode;
  try {
    const saved = await getOwnedPreferences(user.id);
    const preferences = saved
      ? {
          displayName: saved.displayName,
          theme: saved.theme,
          reducedMotion: saved.reducedMotion,
          defaultSimulationSpeed: saved.defaultSimulationSpeed,
          telemetryDensity: saved.telemetryDensity,
        }
      : {
          ...DEFAULT_PREFERENCES,
          displayName: user.name ?? DEFAULT_PREFERENCES.displayName,
        };
    const storage = accountStorageSummary();
    content = (
      <>
        <header className="dashboard-heading">
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p>
            Adjust your local investigation experience and review saved-data
            limits.
          </p>
        </header>
        <section className="dashboard-card">
          <h2>Preferences</h2>
          <SettingsForm initial={preferences} />
        </section>
        <section className="dashboard-card">
          <h2>Account data summary</h2>
          <dl className="detail-list">
            <div>
              <dt>Raw telemetry</dt>
              <dd>Not stored</dd>
            </div>
            <div>
              <dt>Evidence limit</dt>
              <dd>{storage.evidenceLimit} items per incident</dd>
            </div>
            <div>
              <dt>Hypothesis limit</dt>
              <dd>{storage.hypothesisLimit} per incident</dd>
            </div>
            <div>
              <dt>Temporary retention</dt>
              <dd>{storage.temporaryRetentionDays} days</dd>
            </div>
          </dl>
        </section>
        <section className="dashboard-card danger-zone">
          <h2>Delete account</h2>
          <p>
            Account deletion is intentionally not automatic in Phase 7. Contact
            the deployment operator for an identity-verified export and deletion
            workflow. This page never silently deletes account data.
          </p>
          <button className="button button-secondary" disabled>
            Request deletion (not yet available)
          </button>
        </section>
      </>
    );
  } catch {
    content = <DatabaseUnavailable />;
  }
  return (
    <main id="main-content" className="dashboard-shell">
      <div className="dashboard-layout">
        <DashboardNav displayName={user.name ?? "Incident responder"} />
        <div className="dashboard-content">{content}</div>
      </div>
    </main>
  );
}
