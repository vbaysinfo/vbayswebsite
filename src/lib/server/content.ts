import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  seedBeforeAfter, seedFactory, seedGallery, seedProjects, seedServices, seedSettings, seedTestimonials,
} from "@/data/seed";
import {
  activeSorted, toBeforeAfter, toFactory, toGallery, toProject, toService, toSettings, toTestimonial, type Row,
} from "@/lib/normalize";
import type { InstagramMedia, SiteContent } from "@/lib/types";
import { callAppsScript, isBackendConfigured } from "./apps-script";

export const CMS_TAG = "cms";

type RawContent = {
  settings: Row;
  services: Row[];
  projects: Row[];
  gallery: Row[];
  beforeAfter: Row[];
  testimonials: Row[];
  factory: Row[];
};

const seedContent = (): SiteContent => ({
  settings: seedSettings,
  services: activeSorted(seedServices),
  projects: activeSorted(seedProjects),
  gallery: activeSorted(seedGallery),
  beforeAfter: activeSorted(seedBeforeAfter),
  testimonials: activeSorted(seedTestimonials),
  factory: activeSorted(seedFactory),
});

/**
 * All public CMS content in one cached call (one round-trip to Apps Script).
 * Refreshes every 5 minutes, or immediately via POST /api/revalidate.
 * If Google Sheets is unavailable the site keeps working on seed content.
 */
export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(CMS_TAG);

  if (!isBackendConfigured()) {
    cacheLife("hours");
    return seedContent();
  }
  try {
    const raw = await callAppsScript<RawContent>("content");
    const services = activeSorted((raw.services || []).map(toService)).filter((s) => s.serviceName);
    const content: SiteContent = {
      settings: toSettings(raw.settings || {}, seedSettings),
      services: services.length ? services : seedContent().services,
      projects: activeSorted((raw.projects || []).map(toProject)).filter((p) => p.projectName),
      gallery: activeSorted((raw.gallery || []).map(toGallery)).filter((g) => g.imageUrl),
      beforeAfter: activeSorted((raw.beforeAfter || []).map(toBeforeAfter)).filter((b) => b.beforeImage && b.afterImage),
      testimonials: activeSorted((raw.testimonials || []).map(toTestimonial)).filter((t) => t.review),
      factory: activeSorted((raw.factory || []).map(toFactory)),
    };
    if (!content.factory.length) content.factory = seedContent().factory;
    cacheLife({ stale: 60, revalidate: 300, expire: 86400 });
    return content;
  } catch (err) {
    console.error("[content] falling back to seed content:", (err as Error).message);
    cacheLife({ stale: 30, revalidate: 60, expire: 600 });
    return seedContent();
  }
}

export async function getSettings() {
  return (await getContent()).settings;
}

export async function getServiceBySlug(slug: string) {
  return (await getContent()).services.find((s) => s.slug === slug);
}

export async function getProjectBySlug(slug: string) {
  return (await getContent()).projects.find((p) => p.slug === slug);
}

/** Latest Instagram media via the official Instagram Graph API (proxied by Apps Script). */
export async function getInstagramMedia(): Promise<InstagramMedia[]> {
  "use cache";
  cacheTag(CMS_TAG, "instagram");
  if (!isBackendConfigured()) {
    cacheLife("hours");
    return [];
  }
  try {
    const media = await callAppsScript<InstagramMedia[]>("instagram", { limit: 8 }, { timeoutMs: 10000 });
    cacheLife("hours");
    return Array.isArray(media) ? media : [];
  } catch {
    cacheLife({ stale: 60, revalidate: 600, expire: 3600 });
    return [];
  }
}

/** Current year, cached daily (Date is non-deterministic during prerender). */
export async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
