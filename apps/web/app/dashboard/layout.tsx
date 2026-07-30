import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requireOwner } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwner("/dashboard");
  return (
    <main id="main-content" className="dashboard-shell">
      <div className="dashboard-layout">
        <DashboardNav displayName={user.name ?? "Incident responder"} />
        <div className="dashboard-content">{children}</div>
      </div>
    </main>
  );
}
