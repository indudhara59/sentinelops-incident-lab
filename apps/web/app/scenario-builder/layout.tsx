import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requireOwner } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ScenarioBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwner("/scenario-builder");
  return (
    <main id="main-content" className="dashboard-shell">
      <div className="dashboard-layout">
        <DashboardNav displayName={user.name ?? "Scenario author"} />
        <div className="dashboard-content">{children}</div>
      </div>
    </main>
  );
}
