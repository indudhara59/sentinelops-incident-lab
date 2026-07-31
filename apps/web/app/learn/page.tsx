import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, RadioTower } from "lucide-react";
import { GuidedCourse } from "@/components/learning/guided-course";
import { LEARNING_TOPICS } from "@/lib/learning/content";

export const metadata: Metadata = {
  title: "Observability and incident-response learning center",
  description:
    "A guided, evidence-first course in observability, incident triage, mitigation, recovery, and post-incident learning.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "SentinelOps Learning Center",
    description:
      "Learn evidence-first observability and incident response in a safe simulated environment.",
    type: "website",
    url: "/learn",
  },
};

export default function LearnPage() {
  return (
    <main id="main-content" className="learning-home grid-bg">
      <section className="container learning-hero">
        <div>
          <span className="eyebrow">LEARNING CENTER</span>
          <h1>Build an evidence-first incident response practice.</h1>
          <p>
            Learn how signals fit together, investigate without premature
            certainty, mitigate safely, verify recovery, and turn incidents into
            durable system improvements.
          </p>
          <a className="button" href="#guided-course">
            Resume guided course <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <aside aria-label="Course characteristics">
          <RadioTower size={24} aria-hidden="true" />
          <strong>Safe, fictional practice</strong>
          <span>10 guided steps</span>
          <span>Original lessons and knowledge checks</span>
          <span>No fake certificates</span>
        </aside>
      </section>

      <section className="container topic-directory" aria-labelledby="topics">
        <span className="eyebrow">REFERENCE LIBRARY</span>
        <h2 id="topics">Learn the signals and response loop</h2>
        <div className="topic-grid">
          {LEARNING_TOPICS.map((topic, index) => (
            <Link key={topic.slug} href={`/learn/${topic.slug}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <BookOpen size={18} aria-hidden="true" />
              <h3>{topic.title.split(":")[0]}</h3>
              <p>{topic.description}</p>
              <strong>
                Read guide <ArrowRight size={14} aria-hidden="true" />
              </strong>
            </Link>
          ))}
        </div>
      </section>

      <div id="guided-course" className="container">
        <GuidedCourse />
      </div>
    </main>
  );
}
