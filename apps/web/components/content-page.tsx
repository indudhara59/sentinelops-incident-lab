import Link from "next/link";

export function ContentPage({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="content-page grid-bg">
      <div className="container page-inner">
        <span className="kicker">{kicker}</span>
        <h1>{title}</h1>
        <p className="intro">{intro}</p>
        {children}
        <div className="page-actions">
          <Link className="button" href="/">
            Return home
          </Link>
          <Link className="button secondary" href="/docs">
            Read the docs
          </Link>
        </div>
      </div>
    </main>
  );
}
