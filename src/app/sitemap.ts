import type { MetadataRoute } from "next";
import { getContent } from "@/lib/server/content";
import { citySlug, SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, projects, settings } = await getContent();
  const staticPaths = ["", "/interiors", "/projects", "/gallery", "/factory", "/contact", "/get-quote"];
  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...services.map((s) => ({ url: `${SITE_URL}/interiors/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...services.flatMap((s) => settings.serviceAreas.map((c) => ({ url: `${SITE_URL}/interiors/${s.slug}/${citySlug(c)}`, changeFrequency: "monthly" as const, priority: 0.6 }))),
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
