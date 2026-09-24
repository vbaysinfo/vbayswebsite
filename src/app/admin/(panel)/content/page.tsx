import { connection } from "next/server";
import { CheckCircle2, CircleDashed, ExternalLink } from "lucide-react";
import { requireSession } from "@/lib/server/auth";
import { isDemoMode } from "@/lib/server/backend";
import { getContent } from "@/lib/server/content";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const metadata = { title: "Website Content" };

const SHEETS = [
  ["SETTINGS", "Company name, logo, phone, WhatsApp, email, addresses, maps, social links, CTA text, city & service areas, hero images, auto-publish"],
  ["SERVICES", "Interior services, SEO title/description/H1 (use {city}), images, benefits, materials, FAQs, WhatsApp message"],
  ["PROJECTS", "Completed projects, cover & gallery images, featured flag, display order"],
  ["GALLERY", "Gallery images by category (including Factory)"],
  ["BEFORE_AFTER", "Before/after image pairs"],
  ["TESTIMONIALS", "Approved customer reviews only — set Active = TRUE to publish"],
  ["FACTORY", "Factory process steps, capabilities and photos"],
  ["LEADS", "All enquiries (private)"],
  ["EVENTS", "WhatsApp / call / Instagram / maps click tracking (private)"],
  ["SOCIAL_POSTS", "Social content drafts, schedules and publish results"],
  ["CONTENT_CALENDAR", "Weekly posting schedule"],
  ["CAMPAIGNS", "Campaigns & UTM parameters, auto-calculated metrics"],
];

export default async function ContentPage() {
  await connection();
  const session = await requireSession("admin");
  const { settings, services, projects, gallery, testimonials } = await getContent();
  const sheetUrl = process.env.GOOGLE_SHEET_URL;
  const checks: [string, boolean, string][] = [
    ["Google Sheets API (Apps Script)", !isDemoMode(), "APPS_SCRIPT_URL + APPS_SCRIPT_SECRET"],
    ["Google Analytics 4", Boolean(process.env.NEXT_PUBLIC_GA_ID), "NEXT_PUBLIC_GA_ID"],
    ["Search Console verification", Boolean(process.env.NEXT_PUBLIC_GSC_VERIFICATION), "NEXT_PUBLIC_GSC_VERIFICATION"],
    ["Anti-spam CAPTCHA (Turnstile)", Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY), "TURNSTILE keys"],
    ["Cache refresh secret", Boolean(process.env.REVALIDATE_SECRET), "REVALIDATE_SECRET"],
    ["Google Business Profile link", Boolean(settings.googleBusinessProfileUrl), "SETTINGS → Google Business Profile URL"],
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium">Website Content</h1>
          <p className="text-sm text-muted">All website content is managed in Google Sheets — no code changes needed. Signed in as {session.sub}.</p>
        </div>
        <div className="flex gap-2">
          {sheetUrl && <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><ExternalLink className="h-4 w-4" />Open Google Sheet</a>}
          <RefreshButton />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[["Services", services.length], ["Projects", projects.length], ["Gallery images", gallery.length], ["Approved testimonials", testimonials.length], ["Service areas", settings.serviceAreas.length]].map(([l, v]) => (
          <div key={l} className="card p-4"><p className="text-xs font-semibold text-muted">{l}</p><p className="mt-1 font-display text-3xl">{v}</p></div>
        ))}
      </div>
      <section className="card p-5">
        <h2 className="font-sans text-sm font-bold tracking-normal">Integration status</h2>
        <ul className="mt-3 divide-y divide-line">
          {checks.map(([l, ok, hint]) => (
            <li key={l} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">{ok ? <CheckCircle2 className="h-4 w-4 text-wa" /> : <CircleDashed className="h-4 w-4 text-muted" />}{l}</span>
              <span className="text-xs text-muted">{ok ? "Connected" : `Set ${hint}`}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Instagram feed & Meta publishing tokens are stored in Apps Script → Project Settings → Script Properties (never in the website).</p>
      </section>
      <section className="card overflow-x-auto p-5">
        <h2 className="font-sans text-sm font-bold tracking-normal">Sheets reference</h2>
        <table className="mt-3 w-full min-w-[36rem] text-sm">
          <tbody className="divide-y divide-line">
            {SHEETS.map(([n, d]) => <tr key={n}><td className="py-2.5 pr-4 font-mono text-xs font-semibold">{n}</td><td className="py-2.5 text-ink-soft">{d}</td></tr>)}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-muted">After editing, changes appear automatically within ~5 minutes — or press “Refresh website content” to publish immediately.</p>
      </section>
    </div>
  );
}
