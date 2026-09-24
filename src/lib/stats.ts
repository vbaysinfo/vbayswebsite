import type { Campaign, EventSummary, Lead } from "./types";

export type DashboardStats = {
  totals: Record<string, number>;
  bySource: [string, number][];
  byService: [string, number][];
  byStatus: [string, number][];
  byMonth: [string, number][];
  dueFollowUps: Lead[];
  recent: Lead[];
  campaigns: { name: string; leads: number; whatsapp: number; calls: number; conversions: number }[];
};

const count = (rows: string[]) => {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(r || "Unknown", (m.get(r || "Unknown") || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export function computeStats(leads: Lead[], events: EventSummary, campaigns: Campaign[], today: string): DashboardStats {
  const by = (s: string) => leads.filter((l) => l.status === s).length;
  const months = new Map<string, number>();
  // Last 6 months, oldest first, including empty months.
  const [y, m] = today.split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    months.set(d.toISOString().slice(0, 7), 0);
  }
  leads.forEach((l) => {
    const k = (l.date || l.createdAt).slice(0, 7);
    if (months.has(k)) months.set(k, (months.get(k) || 0) + 1);
  });

  return {
    totals: {
      total: leads.length,
      new: by("New"),
      contacted: by("Contacted"),
      followUp: by("Follow-up"),
      siteVisit: by("Site Visit"),
      quotation: by("Quotation") + by("Negotiation"),
      confirmed: by("Confirmed"),
      completed: by("Completed"),
      lost: by("Lost"),
      whatsappClicks: events.byType.whatsapp_click || 0,
      calls: events.byType.call_click || 0,
      websiteEnquiries: leads.length,
      instagramLeads: leads.filter((l) => l.source === "Instagram").length,
      googleLeads: leads.filter((l) => l.source === "Google").length,
    },
    bySource: count(leads.map((l) => l.source)),
    byService: count(leads.map((l) => l.requirement)),
    byStatus: count(leads.map((l) => l.status)),
    byMonth: [...months.entries()].map(([k, v]) => [new Date(`${k}-01T00:00:00Z`).toLocaleString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }), v]),
    dueFollowUps: leads
      .filter((l) => l.followUpDate && l.followUpDate <= today && !["Completed", "Lost", "Confirmed"].includes(l.status))
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)),
    recent: leads.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    campaigns: campaigns.map((c) => ({ name: c.campaignName, leads: c.leads, whatsapp: c.whatsappClicks, calls: c.calls, conversions: c.conversions })),
  };
}

export const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
