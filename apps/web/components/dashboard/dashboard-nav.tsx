import {
  LayoutDashboard,
  ListChecks,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth";

const links = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Investigations", "/dashboard/incidents", ListChecks],
  ["Reports", "/dashboard/reports", FileText],
  ["Settings", "/settings", Settings],
] as const;

export function DashboardNav({ displayName }: { displayName: string }) {
  return (
    <aside className="dashboard-nav" aria-label="Account navigation">
      <div>
        <p className="eyebrow">Responder workspace</p>
        <strong>{displayName}</strong>
      </div>
      <nav>
        {links.map(([label, href, Icon]) => (
          <Link href={href} key={href}>
            <Icon size={17} aria-hidden="true" /> {label}
          </Link>
        ))}
      </nav>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="dashboard-nav-signout" type="submit">
          <LogOut size={17} aria-hidden="true" /> Sign out
        </button>
      </form>
    </aside>
  );
}
