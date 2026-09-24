import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { requireSession } from "@/lib/server/auth";
import { eventSummary, listCampaigns, listLeads } from "@/lib/server/backend";
import { computeStats, istToday } from "@/lib/stats";
import { BarChart, ColumnChart } from "@/components/admin/BarChart";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await connection();
  await requireSession();
  const [leadsRes, eventsRes, campaignsRes] = await Promise.allSettled([listLeads(), eventSummary(), listCampaigns()]);
  const leads = leadsRes.status === "fulfilled" ? leadsRes.value : [];
  const error = leadsRes.status === "rejected" ? String((leadsRes.reason as Error)?.message || leadsRes.reason) : "";
  const events = eventsRes.status === "fulfilled" ? eventsRes.value : { byType: {}, byCampaign: {}, bySource: {} };
  const campaigns = campaignsRes.status === "fulfilled" ? campaignsRes.value : [];
  const today = istToday();
  const s = computeStats(leads, events, campaigns, today);
  const t = s.totals;
  const tiles: [string, number, string?][] = [
    ["Total Leads", t.total, "/admin/leads"],
    ["New Leads", t.new, "/admin/leads?status=New"],
    ["Contacted", t.contacted, "/admin/leads?status=Contacted"],
    ["Follow-ups", t.followUp, "/admin/leads?status=Follow-up"],
    ["Site Visits", t.siteVisit, "/admin/leads?status=Site+Visit"],
    ["Quotations", t.quotation, "/admin/leads?status=Quotation"],
    ["Confirmed", t.confirmed, "/admin/leads?status=Confirmed"],
    ["Completed", t.completed, "/admin/leads?status=Completed"],
    ["Lost", t.lost, "/admin/leads?status=Lost"],
    ["WhatsApp Clicks", t.whatsappClicks],
    ["Calls", t.calls],
    ["Website Enquiries", t.websiteEnquiries],
    ["Instagram Leads", t.instagramLeads, "/admin/leads?source=Instagram"],
    ["Google Leads", t.googleLeads, "/admin/leads?source=Google"],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Dashboard</h1>
          <p className="text-sm text-muted">Today · {today}</p>
        </div>
        <Link href="/admin/leads" className="btn btn-primary btn-sm">Manage leads</Link>
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertTriangle className="h-5 w-5 shrink-0" /> Could not load leads from Google Sheets. Check the Apps Script deployment and secret. ({error})
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {tiles.map(([label, value, href]) => {
          const body = (
            <>
              <p className="text-xs font-semibold text-muted">{label}</p>
              <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="card p-4 transition-shadow hover:shadow-lift">{body}</Link>
          ) : (
            <div key={label} className="card p-4">{body}</div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ColumnChart title="Leads by month" data={s.byMonth} />
        <BarChart title="Leads by source" data={s.bySource} />
        <BarChart title="Leads by service" data={s.byService} />
        <BarChart title="Leads by status" data={s.byStatus} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-sans text-sm font-bold tracking-normal"><CalendarClock className="h-4 w-4 text-brass" />Follow-ups due (today & overdue)</h2>
          {s.dueFollowUps.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing due. 🎉</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {s.dueFollowUps.slice(0, 10).map((l) => (
                <li key={l.leadId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/leads/${encodeURIComponent(l.leadId)}`} className="min-w-0 truncate font-semibold hover:underline">{l.name} <span className="font-normal text-muted">· {l.requirement}</span></Link>
                  <span className={`shrink-0 text-xs font-semibold ${l.followUpDate < today ? "text-red-700" : "text-brass-dark"}`}>{l.followUpDate}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="font-sans text-sm font-bold tracking-normal">Latest leads</h2>
          <ul className="mt-3 divide-y divide-line">
            {s.recent.map((l) => (
              <li key={l.leadId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link href={`/admin/leads/${encodeURIComponent(l.leadId)}`} className="min-w-0 truncate hover:underline"><span className="font-semibold">{l.name}</span> <span className="text-muted">· {l.requirement || "—"} · {l.source}</span></Link>
                <StatusBadge status={l.status} />
              </li>
            ))}
            {s.recent.length === 0 && <li className="py-6 text-center text-sm text-muted">No leads yet. Submit the form on the website to test.</li>}
          </ul>
        </section>
      </div>

      <section className="card overflow-x-auto p-5">
        <h2 className="font-sans text-sm font-bold tracking-normal">Campaign performance</h2>
        <table className="mt-3 w-full min-w-[32rem] text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">Campaign</th><th className="text-right font-semibold">Leads</th><th className="text-right font-semibold">WhatsApp</th><th className="text-right font-semibold">Calls</th><th className="text-right font-semibold">Conversions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {s.campaigns.map((c) => (
              <tr key={c.name}><td className="py-2.5 font-semibold">{c.name}</td><td className="text-right tabular-nums">{c.leads}</td><td className="text-right tabular-nums">{c.whatsapp}</td><td className="text-right tabular-nums">{c.calls}</td><td className="text-right tabular-nums">{c.conversions}</td></tr>
            ))}
            {s.campaigns.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
