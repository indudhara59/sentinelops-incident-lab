import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicPage } from "@/components/learning/topic-page";
import { LEARNING_SLUGS, getLearningTopic } from "@/lib/learning/content";

export function generateStaticParams() {
  return LEARNING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const topic = getLearningTopic((await params).slug);
  if (!topic) return {};
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: `/learn/${topic.slug}` },
    openGraph: {
      title: `${topic.title} · SentinelOps Learning Center`,
      description: topic.description,
      type: "article",
      url: `/learn/${topic.slug}`,
    },
  };
}

export default async function LearningTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const topic = getLearningTopic((await params).slug);
  if (!topic) notFound();
  return <TopicPage topic={topic} />;
}
