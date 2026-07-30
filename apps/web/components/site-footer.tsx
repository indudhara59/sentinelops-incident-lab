import { Github } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>Practice the thinking behind reliable systems—safely.</p>
          <p className="fine-print">
            Independent educational portfolio project. Not affiliated with or
            endorsed by any cloud, observability, or security vendor.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/docs">Documentation</Link>
          <a href="https://github.com">
            <Github size={15} /> GitHub placeholder
          </a>
          <Link href="/docs#security">Security</Link>
          <Link href="/docs#accessibility">Accessibility</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 SentinelOps Incident Lab</span>
        <span>All operational data is simulated.</span>
      </div>
    </footer>
  );
}
