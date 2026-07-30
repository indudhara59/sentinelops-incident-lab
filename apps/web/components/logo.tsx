import Link from "next/link";

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="SentinelOps Incident Lab home">
      <span className="logo-mark" aria-hidden="true">
        <span />
      </span>
      <span>
        <strong>SentinelOps</strong>
        <small>INCIDENT LAB</small>
      </span>
    </Link>
  );
}
