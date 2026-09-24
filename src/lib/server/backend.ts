import "server-only";
import { seedCalendar, seedCampaigns, seedSocialPosts } from "@/data/seed";
import {
  toCalendar, toCampaign, toLead, toSocialPost, type Row,
} from "@/lib/normalize";
import type {
  Attribution, CalendarEntry, Campaign, EventSummary, Lead, LeadUpdate, SocialPost, TrackedEvent,
} from "@/lib/types";
import { callAppsScript, isBackendConfigured } from "./apps-script";

// Single facade over the business data store. In production every call goes
// to Google Apps Script → Google Sheets. Without configuration (local dev /
// preview) an in-memory demo store with the same semantics is used so the
// whole site and admin can be exercised end-to-end.

export type LeadInput = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  propertyType: string;
  requirement: string;
  budget: string;
  propertyStatus: string;
  preferredContact: string;
  message: string;
  formType: "lead" | "contact";
  submissionId: string;
  attribution: Attribution;
};

export type UploadInput = { field: string; name: string; mimeType: string; base64: string };

export type LeadResult = { leadId: string; duplicate: boolean };

export type EventInput = {
  eventType: TrackedEvent;
  page: string;
  service: string;
  label: string;
  attribution: Attribution;
};

export const isDemoMode = () => !isBackendConfigured();

// ─── Demo store ──────────────────────────────────────────────────────────
type DemoStore = {
  leads: Lead[];
  events: (EventInput & { eventId: string; createdAt: string })[];
  social: SocialPost[];
  calendar: CalendarEntry[];
  campaigns: Campaign[];
  seq: Record<string, number>;
  submissions: Map<string, string>;
};
const g = globalThis as unknown as { __vbaysDemo?: DemoStore };
const demo = (): DemoStore =>
  (g.__vbaysDemo ??= {
    leads: [],
    events: [],
    social: [...seedSocialPosts],
    calendar: [...seedCalendar],
    campaigns: [...seedCampaigns],
    seq: {},
    submissions: new Map(),
  });

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
function istParts(d = new Date()) {
  // Business timezone (IST) regardless of server location.
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  const date = `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
  const time = `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
  return { date, time, compact: date.slice(2).replace(/-/g, "") };
}
function nextId(prefix: string, width = 4) {
  const s = demo();
  const { compact } = istParts();
  const key = `${prefix}${compact}`;
  s.seq[key] = (s.seq[key] || 0) + 1;
  return `${prefix}${compact}-${pad(s.seq[key], width)}`;
}

// ─── Public operations ───────────────────────────────────────────────────
export async function createLead(input: LeadInput, uploads: UploadInput[]): Promise<LeadResult> {
  if (!isDemoMode()) {
    return callAppsScript<LeadResult>(input.formType === "contact" ? "contact" : "lead", { ...input, uploads }, { timeoutMs: 45000 });
  }
  const s = demo();
  const existing = s.submissions.get(input.submissionId);
  if (existing) return { leadId: existing, duplicate: true };
  const recent = s.leads.find(
    (l) => l.phone === input.phone && l.requirement === input.requirement &&
      Date.now() - new Date(l.createdAt).getTime() < 10 * 60 * 1000,
  );
  if (recent) return { leadId: recent.leadId, duplicate: true };

  const { date, time } = istParts();
  const now = new Date().toISOString();
  const leadId = nextId("VB");
  const a = input.attribution;
  s.leads.unshift(
    toLead({
      ...input,
      leadId,
      date,
      time,
      fileUrl: uploads.map((u) => `demo://${leadId}/${u.field}/${u.name}`).join("\n"),
      source: a.source,
      campaign: a.campaign,
      utmSource: a.utmSource,
      utmMedium: a.utmMedium,
      utmCampaign: a.utmCampaign,
      utmContent: a.utmContent,
      status: "New",
      remarks: input.formType === "contact" ? "Contact page enquiry" : "",
      createdAt: now,
      updatedAt: now,
    }),
  );
  s.submissions.set(input.submissionId, leadId);
  return { leadId, duplicate: false };
}

export async function logEvent(input: EventInput): Promise<void> {
  if (!isDemoMode()) {
    await callAppsScript("event", input, { timeoutMs: 8000 });
    return;
  }
  demo().events.push({ ...input, eventId: nextId("EV", 5), createdAt: new Date().toISOString() });
}

// ─── Admin operations ────────────────────────────────────────────────────
export async function listLeads(): Promise<Lead[]> {
  if (!isDemoMode()) return (await callAppsScript<Row[]>("admin/leads")).map(toLead);
  return demo().leads;
}

export async function getLead(leadId: string): Promise<Lead | undefined> {
  return (await listLeads()).find((l) => l.leadId === leadId);
}

export async function updateLead(leadId: string, update: LeadUpdate, actor: string): Promise<Lead> {
  if (!isDemoMode()) return toLead(await callAppsScript<Row>("admin/lead-update", { leadId, update, actor }));
  const lead = demo().leads.find((l) => l.leadId === leadId);
  if (!lead) throw new Error("Lead not found");
  const { remarks, ...rest } = update;
  Object.assign(lead, rest);
  if (remarks) {
    const stamp = istParts();
    lead.remarks = `[${stamp.date} ${stamp.time.slice(0, 5)} · ${actor}] ${remarks}${lead.remarks ? "\n" + lead.remarks : ""}`;
  }
  lead.updatedAt = new Date().toISOString();
  return lead;
}

export async function eventSummary(): Promise<EventSummary> {
  if (!isDemoMode()) return callAppsScript<EventSummary>("admin/event-summary");
  const out: EventSummary = { byType: {}, byCampaign: {}, bySource: {} };
  for (const e of demo().events) {
    out.byType[e.eventType] = (out.byType[e.eventType] || 0) + 1;
    const c = e.attribution.utmCampaign || "(none)";
    (out.byCampaign[c] ??= {})[e.eventType] = (out.byCampaign[c][e.eventType] || 0) + 1;
    const src = e.attribution.source || "Direct";
    (out.bySource[src] ??= {})[e.eventType] = (out.bySource[src][e.eventType] || 0) + 1;
  }
  return out;
}

export async function listSocialPosts(): Promise<SocialPost[]> {
  if (!isDemoMode()) return (await callAppsScript<Row[]>("admin/social")).map(toSocialPost);
  return demo().social;
}

export async function saveSocialPost(post: Partial<SocialPost>): Promise<SocialPost> {
  if (!isDemoMode()) return toSocialPost(await callAppsScript<Row>("social-post", { post }));
  const s = demo();
  const now = new Date().toISOString();
  if (post.postId) {
    const existing = s.social.find((p) => p.postId === post.postId);
    if (!existing) throw new Error("Post not found");
    Object.assign(existing, post, { updatedAt: now });
    return existing;
  }
  const created = toSocialPost({ ...post, postId: nextId("SP", 3), status: post.status || "Draft", createdAt: now, updatedAt: now });
  s.social.unshift(created);
  return created;
}

export async function deleteSocialPost(postId: string): Promise<void> {
  if (!isDemoMode()) {
    await callAppsScript("admin/social-delete", { postId });
    return;
  }
  const s = demo();
  s.social = s.social.filter((p) => p.postId !== postId);
}

/** Triggers the publisher for one post. Only platforms with an official publishing API are published. */
export async function publishSocialPost(postId: string): Promise<SocialPost> {
  if (!isDemoMode()) return toSocialPost(await callAppsScript<Row>("admin/social-publish", { postId }, { timeoutMs: 90000 }));
  const post = demo().social.find((p) => p.postId === postId);
  if (!post) throw new Error("Post not found");
  post.status = "Ready to Publish";
  post.errorMessage = "Demo mode: connect Apps Script + Meta Graph API credentials to publish automatically.";
  post.updatedAt = new Date().toISOString();
  return post;
}

export async function getCalendar(): Promise<CalendarEntry[]> {
  if (!isDemoMode()) return (await callAppsScript<Row[]>("admin/calendar")).map(toCalendar);
  return demo().calendar;
}

export async function saveCalendar(entries: CalendarEntry[]): Promise<CalendarEntry[]> {
  if (!isDemoMode()) return (await callAppsScript<Row[]>("admin/calendar-save", { entries })).map(toCalendar);
  demo().calendar = entries;
  return entries;
}

export async function listCampaigns(): Promise<Campaign[]> {
  if (!isDemoMode()) return (await callAppsScript<Row[]>("admin/campaigns")).map(toCampaign);
  const s = demo();
  // Recompute factual metrics from leads + tracked events.
  return s.campaigns.map((c) => {
    const leads = s.leads.filter((l) => c.utmCampaign && l.utmCampaign === c.utmCampaign);
    const ev = s.events.filter((e) => c.utmCampaign && e.attribution.utmCampaign === c.utmCampaign);
    return {
      ...c,
      leads: leads.length,
      conversions: leads.filter((l) => l.status === "Confirmed" || l.status === "Completed").length,
      whatsappClicks: ev.filter((e) => e.eventType === "whatsapp_click").length,
      calls: ev.filter((e) => e.eventType === "call_click").length,
    };
  });
}

export async function saveCampaign(c: Partial<Campaign>): Promise<Campaign> {
  if (!isDemoMode()) return toCampaign(await callAppsScript<Row>("admin/campaign-save", { campaign: c }));
  const s = demo();
  if (c.campaignId) {
    const existing = s.campaigns.find((x) => x.campaignId === c.campaignId);
    if (existing) {
      Object.assign(existing, c);
      return existing;
    }
  }
  const created = toCampaign({ ...c, campaignId: c.campaignId || nextId("CMP", 3) });
  s.campaigns.push(created);
  return created;
}
