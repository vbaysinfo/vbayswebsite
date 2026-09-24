"use client";

import { useState } from "react";
import { Copy, Loader2, Plus } from "lucide-react";
import type { Campaign } from "@/lib/types";

const blank = { campaignName: "", platform: "Instagram", startDate: "", endDate: "", landingPage: "/", utmSource: "instagram", utmMedium: "social", utmCampaign: "", utmContent: "", status: "Active" };

export function CampaignManager({ initial, siteUrl }: { initial: Campaign[]; siteUrl: string }) {
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState<Partial<Campaign>>(blank);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: keyof Campaign, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const trackingUrl = (c: Partial<Campaign>) => {
    const u = new URL(c.landingPage || "/", siteUrl);
    if (c.utmSource) u.searchParams.set("utm_source", c.utmSource);
    if (c.utmMedium) u.searchParams.set("utm_medium", c.utmMedium);
    if (c.utmCampaign) u.searchParams.set("utm_campaign", c.utmCampaign);
    if (c.utmContent) u.searchParams.set("utm_content", c.utmContent);
    return u.toString();
  };

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) return setMsg(json.error || "Could not save");
    setRows((rs) => (rs.some((r) => r.campaignId === json.campaign.campaignId) ? rs.map((r) => (r.campaignId === json.campaign.campaignId ? json.campaign : r)) : [...rs, json.campaign]));
    setForm(blank);
    setMsg("Campaign saved.");
  }

  const f = "field !min-h-10 !py-2 text-sm";
  const rate = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium">Campaigns</h1>
        <p className="text-sm text-muted">Metrics are counted from real leads and tracked clicks whose UTM campaign matches.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="border-b border-line bg-stone/60 text-left text-xs text-muted">
            <tr>{["Campaign", "Platform", "Dates", "UTM campaign", "Leads", "WhatsApp", "Calls", "Conversions", "Conv. rate", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.campaignId}>
                <td className="px-4 py-3 font-semibold">{c.campaignName}<div className="font-mono text-xs font-normal text-muted">{c.campaignId}</div></td>
                <td className="px-4 py-3">{c.platform}</td>
                <td className="px-4 py-3 text-xs">{c.startDate} → {c.endDate}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.utmCampaign}</td>
                <td className="px-4 py-3 tabular-nums">{c.leads}</td>
                <td className="px-4 py-3 tabular-nums">{c.whatsappClicks}</td>
                <td className="px-4 py-3 tabular-nums">{c.calls}</td>
                <td className="px-4 py-3 tabular-nums">{c.conversions}</td>
                <td className="px-4 py-3 tabular-nums">{rate(c.conversions, c.leads)}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => navigator.clipboard?.writeText(trackingUrl(c)).then(() => setMsg("Tracking link copied."))} className="btn btn-outline btn-sm !min-h-8 !px-3 text-xs"><Copy className="h-3.5 w-3.5" />Link</button>
                    <button onClick={() => setForm(c)} className="btn btn-sm !min-h-8 !px-3 text-xs">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-muted">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-sans text-sm font-bold tracking-normal"><Plus className="h-4 w-4" />{form.campaignId ? `Edit ${form.campaignId}` : "New campaign & UTM link builder"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="md:col-span-2"><span className="label">Campaign name</span><input className={f} value={form.campaignName} onChange={(e) => set("campaignName", e.target.value)} /></label>
          <label><span className="label">Platform</span><select className={f} value={form.platform} onChange={(e) => set("platform", e.target.value)}>{["Instagram", "Facebook", "Google", "YouTube", "WhatsApp", "Referral", "Other"].map((p) => <option key={p}>{p}</option>)}</select></label>
          <label><span className="label">Start date</span><input type="date" className={f} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></label>
          <label><span className="label">End date</span><input type="date" className={f} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></label>
          <label><span className="label">Landing page</span><input className={f} value={form.landingPage} onChange={(e) => set("landingPage", e.target.value)} placeholder="/interiors/modular-kitchen" /></label>
          <label><span className="label">UTM source</span><input className={f} value={form.utmSource} onChange={(e) => set("utmSource", e.target.value)} /></label>
          <label><span className="label">UTM medium</span><input className={f} value={form.utmMedium} onChange={(e) => set("utmMedium", e.target.value)} /></label>
          <label><span className="label">UTM campaign</span><input className={f} value={form.utmCampaign} onChange={(e) => set("utmCampaign", e.target.value.replace(/\s+/g, "_").toLowerCase())} /></label>
          <label><span className="label">UTM content</span><input className={f} value={form.utmContent} onChange={(e) => set("utmContent", e.target.value)} /></label>
          <label><span className="label">Status</span><select className={f} value={form.status} onChange={(e) => set("status", e.target.value)}>{["Planned", "Active", "Paused", "Ended"].map((p) => <option key={p}>{p}</option>)}</select></label>
        </div>
        <p className="mt-4 rounded-xl bg-stone p-3 font-mono text-xs break-all">{trackingUrl(form)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button disabled={busy || !form.campaignName} onClick={save} className="btn btn-primary btn-sm">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save campaign"}</button>
          {form.campaignId && <button onClick={() => setForm(blank)} className="btn btn-sm">Cancel edit</button>}
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
