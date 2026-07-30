import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="content-page">
      <div className="container page-inner">
        <span className="kicker">404 · SIGNAL NOT FOUND</span>
        <h1>This route is outside the topology.</h1>
        <p className="intro">The page you requested does not exist.</p>
        <Link className="button" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
