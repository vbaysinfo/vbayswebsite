"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Phone, Search } from "lucide-react";
import { LEAD_STATUSES, type Lead } from "@/lib/types";
import { telUrl, whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { StatusBadge } from "./StatusBadge";

type SortKey = "newest" | "oldest" | "name" | "followUp";

const CSV_COLS: (keyof Lead)[] = ["leadId", "date", "time", "name", "phone", "whatsapp", "email", "city", "propertyType", "requirement", "budget", "propertyStatus", "source", "utmCampaign", "status", "assignedTo", "followUpDate", "lastContactDate"];

export function LeadsTable({ leads: initialLeads, staff, today, initial }: { leads: Lead[]; staff: string[]; today: string; initial: { status: string; source: string; q: string } }) {
  const [leads, setLeads] = useState(initialLeads);
  const [q, setQ] = useState(initial.q);
  const [status, setStatus] = useState(initial.status);
  const [source, setSource] = useState(initial.source);
  const [requirement, setRequirement] = useState("");
  const [assigned, setAssigned] = useState("");
  const [due, setDue] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [saving, setSaving] = useState<string | null>(null);

  const sources = useMemo(() => [...new Set(leads.map((l) => l.source).filter(Boolean))].sort(), [leads]);
  const requirements = useMemo(() => [...new Set(leads.map((l) => l.requirement).filter(Boolean))].sort(), [leads]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = leads.filter((l) =>
      (!status || l.status === status) &&
      (!source || l.source === source) &&
      (!requirement || l.requirement === requirement) &&
      (!assigned || (assigned === "__none" ? !l.assignedTo : l.assignedTo === assigned)) &&
      (!due || (l.followUpDate && l.followUpDate <= today && !["Completed", "Lost", "Confirmed"].includes(l.status))) &&
      (!needle || [l.leadId, l.name, l.phone, l.email, l.city, l.requirement, l.utmCampaign].some((v) => v.toLowerCase().includes(needle))),
    );
    const cmp: Record<SortKey, (a: Lead, b: Lead) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      followUp: (a, b) => (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999"),
    };
    return out.sort(cmp[sort]);
  }, [leads, q, status, source, requirement, assigned, due, sort, today]);

  async function quickStatus(lead: Lead, next: string) {
    setSaving(lead.leadId);
    const res = await fetch(`/api/admin/leads/${encodeURIComponent(lead.leadId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, lastContactDate: next !== "New" ? today : undefined }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) setLeads((ls) => ls.map((l) => (l.leadId === lead.leadId ? json.lead : l)));
    else alert(json.error || "Could not update the lead.");
    setSaving(null);
  }

  function exportCsv() {
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [CSV_COLS.join(","), ...rows.map((r) => CSV_COLS.map((c) => esc(String(r[c]))).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sel = "field !min-h-10 !py-2 text-sm";
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium">Leads</h1>
          <p className="text-sm text-muted">{rows.length} of {leads.length} leads</p>
        </div>
        <button onClick={exportCsv} className="btn btn-outline btn-sm"><Download className="h-4 w-4" />Export CSV</button>
      </div>

      <div className="card mt-6 grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-7">
        <label className="relative md:col-span-3 xl:col-span-2">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, ID, city…" className={`${sel} !pl-9`} />
        </label>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={sel}><option value="">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value)} className={sel}><option value="">All sources</option>{sources.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Requirement" value={requirement} onChange={(e) => setRequirement(e.target.value)} className={sel}><option value="">All services</option>{requirements.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Assigned to" value={assigned} onChange={(e) => setAssigned(e.target.value)} className={sel}><option value="">Anyone</option><option value="__none">Unassigned</option>{staff.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={sel}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option><option value="followUp">Follow-up date</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold md:col-span-3 xl:col-span-7">
          <input type="checkbox" checked={due} onChange={(e) => setDue(e.target.checked)} className="h-4 w-4 accent-[var(--color-brass)]" /> Only follow-ups due today / overdue
        </label>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[60rem] text-sm">
          <thead className="border-b border-line bg-stone/60 text-left text-xs text-muted">
            <tr>
              {["Lead", "Requirement", "Budget", "Source", "Status", "Assigned", "Follow-up", "Contact"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((l) => (
              <tr key={l.leadId} className="align-top hover:bg-stone/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${encodeURIComponent(l.leadId)}`} className="font-semibold hover:underline">{l.name}</Link>
                  <div className="font-mono text-xs text-muted">{l.leadId}</div>
                  <div className="text-xs text-muted">{l.date} {l.time?.slice(0, 5)} · {l.city}</div>
                </td>
                <td className="px-4 py-3">{l.requirement || "—"}<div className="text-xs text-muted">{l.propertyType} {l.propertyStatus && `· ${l.propertyStatus}`}</div></td>
                <td className="px-4 py-3">{l.budget || "—"}</td>
                <td className="px-4 py-3">{l.source}<div className="text-xs text-muted">{l.utmCampaign}</div></td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Status for ${l.name}`}
                    value={l.status}
                    disabled={saving === l.leadId}
                    onChange={(e) => quickStatus(l, e.target.value)}
                    className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold"
                  >
                    {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="mt-1"><StatusBadge status={l.status} /></div>
                </td>
                <td className="px-4 py-3">{l.assignedTo || <span className="text-muted">—</span>}</td>
                <td className={`px-4 py-3 ${l.followUpDate && l.followUpDate < today && !["Completed", "Lost", "Confirmed"].includes(l.status) ? "font-semibold text-red-700" : ""}`}>{l.followUpDate || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <a href={telUrl(l.phone)} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:bg-stone" aria-label={`Call ${l.name}`}><Phone className="h-4 w-4" /></a>
                    <a href={whatsappUrl(l.whatsapp || l.phone, `Hello ${l.name}, thank you for your enquiry (Lead ID ${l.leadId}).`)} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-wa text-white" aria-label={`WhatsApp ${l.name}`}><WhatsAppIcon className="h-4 w-4" /></a>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No leads match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
