import type { MetadataRoute } from "next";
import { LEARNING_SLUGS } from "@/lib/learning/content";
import { scenarios } from "@/data/scenarios";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = [
    "",
    "/learn",
    "/scenarios",
    ...LEARNING_SLUGS.map((slug) => `/learn/${slug}`),
    ...scenarios.flatMap((scenario) => [
      `/scenarios/${scenario.slug}`,
      `/scenarios/${scenario.slug}/briefing`,
    ]),
  ];
  return paths.map((path) => ({
    url: new URL(path || "/", base).toString(),
    changeFrequency: path.startsWith("/learn") ? "monthly" : "weekly",
    priority: path === "" ? 1 : path === "/learn" ? 0.9 : 0.7,
  }));
}
