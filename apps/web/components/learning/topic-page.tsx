import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import {
  GLOSSARY,
  LEARNING_TOPICS,
  type LearningTopic,
} from "@/lib/learning/content";

export function TopicPage({ topic }: { topic: LearningTopic }) {
  const index = LEARNING_TOPICS.findIndex((item) => item.slug === topic.slug);
  const next = LEARNING_TOPICS[index + 1];
  return (
    <main id="main-content" className="learn-shell grid-bg">
      <div className="container learn-layout">
        <aside className="learn-nav">
          <Link className="learn-home-link" href="/learn">
            <BookOpen size={17} aria-hidden="true" /> Guided course
          </Link>
          <nav aria-label="Learning topics">
            {LEARNING_TOPICS.map((item) => (
              <Link
                key={item.slug}
                href={`/learn/${item.slug}`}
                aria-current={item.slug === topic.slug ? "page" : undefined}
              >
                {item.title.split(":")[0]}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="learn-article">
          <span className="eyebrow">{topic.eyebrow}</span>
          <h1>{topic.title}</h1>
          <p className="learn-lede">{topic.description}</p>
          {topic.takeaways.length > 0 && (
            <section className="takeaway-card" aria-labelledby="takeaways">
              <h2 id="takeaways">What you will learn</h2>
              <ul>
                {topic.takeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ul>
            </section>
          )}
          {topic.slug === "glossary" ? (
            <Glossary />
          ) : (
            topic.sections.map((section) => (
              <section key={section.title} className="learning-section">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.details && (
                  <details>
                    <summary>{section.details.summary}</summary>
                    <p>{section.details.body}</p>
                  </details>
                )}
              </section>
            ))
          )}
          <section className="related-topics" aria-labelledby="related-title">
            <h2 id="related-title">Continue learning</h2>
            <div>
              {topic.related.map((slug) => {
                const related = LEARNING_TOPICS.find(
                  (item) => item.slug === slug,
                )!;
                return (
                  <Link key={slug} href={`/learn/${slug}`}>
                    {related.title.split(":")[0]}
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
          {next && (
            <Link className="button learning-next" href={`/learn/${next.slug}`}>
              Next: {next.title.split(":")[0]}
            </Link>
          )}
        </article>
      </div>
    </main>
  );
}

function Glossary() {
  return (
    <section aria-labelledby="glossary-title">
      <h2 id="glossary-title" className="sr-only">
        Glossary terms
      </h2>
      <dl className="glossary-list">
        {GLOSSARY.map(([term, definition]) => (
          <div key={term} id={term.replaceAll(" ", "-")}>
            <dt>{term}</dt>
            <dd>{definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
