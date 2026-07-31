import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/learn/", "/scenarios/"],
      disallow: [
        "/api/",
        "/dashboard/",
        "/operations/",
        "/scenario-builder/",
        "/settings/",
      ],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
