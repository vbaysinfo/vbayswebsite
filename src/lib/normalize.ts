// Converts loosely-typed Google Sheets rows (strings typed by humans) into
// the strict shapes the UI relies on. Everything is tolerant of blanks.

import type {
  BeforeAfter, CalendarEntry, Campaign, FactoryItem, FAQ, GalleryItem, Lead, LeadStatus,
  Project, Service, Settings, SocialPost, SocialStatus, Testimonial,
} from "./types";
import { LEAD_STATUSES, SOCIAL_STATUSES } from "./types";

export type Row = Record<string, unknown>;

export const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());
export const num = (v: unknown, d = 0): number => {
  const n = Number(str(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && str(v) !== "" ? n : d;
};
export const bool = (v: unknown, d = false): boolean => {
  const s = str(v).toLowerCase();
  if (!s) return d;
  return ["true", "yes", "y", "1", "active", "on"].includes(s);
};
/** Splits lists typed as new lines, pipes, or commas (commas only when no URLs). */
export const list = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(str).filter(Boolean);
  const s = str(v);
  if (!s) return [];
  const sep = /\n|\|/.test(s) ? /\n|\|/ : /,(?![^()]*\))/;
  return s.split(sep).map((x) => x.trim()).filter(Boolean);
};
/** FAQs: one per line, "Question :: Answer". */
export const faqs = (v: unknown): FAQ[] =>
  str(v)
    .split(/\n/)
    .map((l) => l.split("::"))
    .filter((p) => p.length >= 2 && p[0].trim())
    .map(([q, ...a]) => ({ q: q.trim(), a: a.join("::").trim() }));

/** Converts an ISO / sheet date into yyyy-mm-dd, or "" when empty/invalid. */
export const isoDate = (v: unknown): string => {
  const s = str(v);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const byOrder = <T extends { displayOrder: number }>(a: T, b: T) => a.displayOrder - b.displayOrder;

export function toSettings(raw: Row, fallback: Settings): Settings {
  const s = (k: keyof Settings) => str(raw[k]) || (fallback[k] as string);
  const areas = list(raw.serviceAreas);
  const staff = list(raw.staffMembers);
  return {
    companyName: s("companyName"),
    logoUrl: str(raw.logoUrl),
    phone: s("phone"),
    whatsappNumber: (str(raw.whatsappNumber) || fallback.whatsappNumber).replace(/[^0-9]/g, ""),
    email: s("email"),
    officeAddress: s("officeAddress"),
    factoryAddress: s("factoryAddress"),
    googleMapsUrl: str(raw.googleMapsUrl),
    factoryMapsUrl: str(raw.factoryMapsUrl),
    googleBusinessProfileUrl: str(raw.googleBusinessProfileUrl),
    googleReviewUrl: str(raw.googleReviewUrl),
    instagramUrl: s("instagramUrl"),
    instagramHandle: s("instagramHandle").replace(/^@/, ""),
    facebookUrl: str(raw.facebookUrl),
    youtubeUrl: str(raw.youtubeUrl),
    workingHours: s("workingHours"),
    whatsappDefaultMessage: s("whatsappDefaultMessage"),
    footerText: s("footerText"),
    primaryCta: s("primaryCta"),
    secondaryCta: s("secondaryCta"),
    defaultCity: s("defaultCity"),
    serviceAreas: areas.length ? areas : fallback.serviceAreas,
    staffMembers: staff.length ? staff : fallback.staffMembers,
    heroImage: s("heroImage"),
    factoryHeroImage: s("factoryHeroImage"),
    aboutImage: s("aboutImage"),
    yearsExperience: str(raw.yearsExperience),
    projectsCompleted: str(raw.projectsCompleted),
    factoryArea: str(raw.factoryArea),
    autoPublish: bool(raw.autoPublish, false),
  };
}

export function toService(r: Row): Service {
  const name = str(r.serviceName);
  return {
    serviceId: str(r.serviceId),
    serviceName: name,
    category: str(r.category),
    slug: str(r.slug) || slugify(name),
    shortDescription: str(r.shortDescription),
    fullDescription: str(r.fullDescription),
    mainImage: str(r.mainImage),
    galleryImages: list(r.galleryImages),
    startingPrice: str(r.startingPrice),
    seoTitle: str(r.seoTitle),
    seoDescription: str(r.seoDescription),
    h1: str(r.h1),
    imageAlt: str(r.imageAlt) || name,
    benefits: list(r.benefits),
    materials: list(r.materials),
    designExamples: list(r.designExamples),
    faqs: Array.isArray(r.faqs) ? (r.faqs as FAQ[]) : faqs(r.faqs),
    featured: bool(r.featured),
    displayOrder: num(r.displayOrder, 999),
    whatsappMessage: str(r.whatsappMessage),
    active: bool(r.active, true),
  };
}

export function toProject(r: Row): Project {
  const name = str(r.projectName);
  return {
    projectId: str(r.projectId),
    projectName: name,
    slug: str(r.slug) || slugify(`${name}-${str(r.projectId)}`),
    location: str(r.location),
    category: str(r.category),
    serviceSlug: str(r.serviceSlug),
    description: str(r.description),
    projectDate: str(r.projectDate),
    area: str(r.area),
    budgetRange: str(r.budgetRange),
    coverImage: str(r.coverImage),
    galleryImages: list(r.galleryImages),
    featured: bool(r.featured),
    displayOrder: num(r.displayOrder, 999),
    active: bool(r.active, true),
  };
}

export const toGallery = (r: Row): GalleryItem => ({
  imageId: str(r.imageId),
  projectId: str(r.projectId),
  category: str(r.category),
  imageUrl: str(r.imageUrl),
  title: str(r.title),
  description: str(r.description),
  displayOrder: num(r.displayOrder, 999),
  active: bool(r.active, true),
});

export const toBeforeAfter = (r: Row): BeforeAfter => ({
  id: str(r.id),
  projectName: str(r.projectName),
  description: str(r.description),
  location: str(r.location),
  category: str(r.category),
  beforeImage: str(r.beforeImage),
  afterImage: str(r.afterImage),
  displayOrder: num(r.displayOrder, 999),
  active: bool(r.active, true),
});

export const toTestimonial = (r: Row): Testimonial => ({
  testimonialId: str(r.testimonialId),
  customerName: str(r.customerName),
  location: str(r.location),
  projectType: str(r.projectType),
  review: str(r.review),
  rating: Math.max(0, Math.min(5, num(r.rating, 5))),
  photo: str(r.photo),
  displayOrder: num(r.displayOrder, 999),
  // Testimonials are opt-in: must be explicitly approved (Active = TRUE).
  active: bool(r.active, false),
});

export const toFactory = (r: Row): FactoryItem => {
  const t = str(r.type).toLowerCase();
  return {
    id: str(r.id),
    type: t === "capability" || t === "image" ? t : "process",
    title: str(r.title),
    description: str(r.description),
    imageUrl: str(r.imageUrl),
    displayOrder: num(r.displayOrder, 999),
    active: bool(r.active, true),
  };
};

export const activeSorted = <T extends { active: boolean; displayOrder: number }>(rows: T[]) =>
  rows.filter((r) => r.active).sort(byOrder);

export function toLead(r: Row): Lead {
  const status = str(r.status) as LeadStatus;
  return {
    leadId: str(r.leadId),
    date: isoDate(r.date),
    time: str(r.time),
    name: str(r.name),
    phone: str(r.phone),
    whatsapp: str(r.whatsapp),
    email: str(r.email),
    city: str(r.city),
    propertyType: str(r.propertyType),
    requirement: str(r.requirement),
    budget: str(r.budget),
    propertyStatus: str(r.propertyStatus),
    preferredContact: str(r.preferredContact),
    message: str(r.message),
    fileUrl: str(r.fileUrl),
    source: str(r.source) || "Website",
    campaign: str(r.campaign),
    utmSource: str(r.utmSource),
    utmMedium: str(r.utmMedium),
    utmCampaign: str(r.utmCampaign),
    utmContent: str(r.utmContent),
    status: (LEAD_STATUSES as readonly string[]).includes(status) ? status : "New",
    assignedTo: str(r.assignedTo),
    followUpDate: isoDate(r.followUpDate),
    lastContactDate: isoDate(r.lastContactDate),
    remarks: str(r.remarks),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

export function toSocialPost(r: Row): SocialPost {
  const status = str(r.status) as SocialStatus;
  return {
    postId: str(r.postId),
    contentType: str(r.contentType) || "Image",
    platform: str(r.platform) || "Instagram",
    caption: str(r.caption),
    imageUrl: str(r.imageUrl),
    videoUrl: str(r.videoUrl),
    hashtags: str(r.hashtags),
    campaignId: str(r.campaignId),
    scheduledDate: isoDate(r.scheduledDate),
    scheduledTime: str(r.scheduledTime),
    status: (SOCIAL_STATUSES as readonly string[]).includes(status) ? status : "Draft",
    publishedUrl: str(r.publishedUrl),
    errorMessage: str(r.errorMessage),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

export const toCalendar = (r: Row): CalendarEntry => ({
  day: str(r.day),
  category: str(r.category),
  serviceSlug: str(r.serviceSlug),
  contentType: str(r.contentType) || "Image",
  platform: str(r.platform) || "Instagram",
  time: str(r.time) || "18:30",
  active: bool(r.active, true),
});

export const toCampaign = (r: Row): Campaign => ({
  campaignId: str(r.campaignId),
  campaignName: str(r.campaignName),
  platform: str(r.platform),
  startDate: isoDate(r.startDate),
  endDate: isoDate(r.endDate),
  landingPage: str(r.landingPage),
  utmSource: str(r.utmSource),
  utmMedium: str(r.utmMedium),
  utmCampaign: str(r.utmCampaign),
  utmContent: str(r.utmContent),
  leads: num(r.leads),
  whatsappClicks: num(r.whatsappClicks),
  calls: num(r.calls),
  conversions: num(r.conversions),
  status: str(r.status) || "Active",
});
