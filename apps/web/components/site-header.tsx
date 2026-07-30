import { Github, Menu } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeSelector } from "@/components/theme-selector";

const links = [
  ["Platform", "/#platform"],
  ["Scenarios", "/scenarios"],
  ["How it works", "/#workflow"],
  ["Learning center", "/learn"],
  ["Dashboard", "/dashboard"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={label} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a
            className="icon-link github-link"
            href="https://github.com"
            aria-label="GitHub placeholder — repository coming soon"
          >
            <Github size={17} aria-hidden="true" />
            <span>GitHub</span>
          </a>
          <ThemeSelector />
          <Link className="button button-small" href="/lab">
            Enter Incident Lab
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={21} />
            </summary>
            <nav aria-label="Mobile navigation">
              {links.map(([label, href]) => (
                <Link key={label} href={href}>
                  {label}
                </Link>
              ))}
              <Link href="/docs">Documentation</Link>
              <Link href="/lab">Enter Incident Lab</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
