"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { LEAD_STATUSES, type Lead } from "@/lib/types";
import { telUrl, whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";

const PIPELINE = LEAD_STATUSES.filter((s) => s !== "Lost");

export function LeadEditor({ lead, staff, today }: { lead: Lead; staff: string[]; today: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: lead.status,
    assignedTo: lead.assignedTo,
    followUpDate: lead.followUpDate,
    lastContactDate: lead.lastContactDate,
    remarks: "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [history, setHistory] = useState(lead.remarks);
  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setState("idle"); };

  async function save() {
    setState("saving");
    const res = await fetch(`/api/admin/leads/${encodeURIComponent(lead.leadId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) {
      setHistory(json.lead.remarks);
      setState("saved");
      setForm((f) => ({ ...f, remarks: "" }));
      router.refresh();
    } else setState("error");
  }

  const addDays = (n: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    set("followUpDate", d.toISOString().slice(0, 10));
  };
  const currentIdx = PIPELINE.indexOf(form.status as (typeof PIPELINE)[number]);

  return (
    <aside className="card h-fit space-y-5 p-6 xl:sticky xl:top-6">
      <div className="grid grid-cols-2 gap-2">
        <a href={telUrl(lead.phone)} className="btn btn-outline btn-sm"><Phone className="h-4 w-4" />Call</a>
        <a href={whatsappUrl(lead.whatsapp || lead.phone, `Hello ${lead.name}, thank you for your interior enquiry (Lead ID ${lead.leadId}). This is from our design team.`)} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>
      </div>

      <div>
        <span className="label">Pipeline</span>
        <ol className="flex flex-wrap gap-1">
          {PIPELINE.map((s, i) => (
            <li key={s}>
              <button type="button" onClick={() => set("status", s)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${form.status === s ? "bg-ink text-white" : i < currentIdx ? "bg-brass-soft text-brass-dark" : "bg-stone text-muted"}`}>{s}</button>
            </li>
          ))}
          <li><button type="button" onClick={() => set("status", "Lost")} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${form.status === "Lost" ? "bg-red-700 text-white" : "bg-red-50 text-red-800"}`}>Lost</button></li>
        </ol>
      </div>

      <div>
        <label className="label" htmlFor="le-assign">Assigned to</label>
        <select id="le-assign" className="field" value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
          <option value="">Unassigned</option>
          {[...new Set([...staff, form.assignedTo].filter(Boolean))].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="le-fu">Next follow-up date</label>
        <input id="le-fu" type="date" className="field" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
        <div className="mt-2 flex gap-1.5">
          {[["Tomorrow", 1], ["+3 days", 3], ["+1 week", 7]].map(([l, n]) => <button key={l} type="button" className="chip !py-1 text-xs" onClick={() => addDays(Number(n))}>{l}</button>)}
          {form.followUpDate && <button type="button" className="chip !py-1 text-xs" onClick={() => set("followUpDate", "")}>Clear</button>}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="le-lc">Last contact date</label>
        <div className="flex gap-2">
          <input id="le-lc" type="date" className="field" value={form.lastContactDate} onChange={(e) => set("lastContactDate", e.target.value)} />
          <button type="button" className="btn btn-outline btn-sm" onClick={() => set("lastContactDate", today)}>Today</button>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="le-rm">Add remark</label>
        <textarea id="le-rm" rows={3} maxLength={1000} className="field" placeholder="Called, site visit booked for Saturday…" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
      </div>
      <button onClick={save} disabled={state === "saving"} className="btn btn-primary w-full">
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
      </button>
      {state === "saved" && <p role="status" className="text-center text-sm font-semibold text-wa">Saved to Google Sheets ✓</p>}
      {state === "error" && <p role="alert" className="text-center text-sm font-semibold text-red-700">Could not save. Please retry.</p>}
      <div className="border-t border-line pt-5">
        <h2 className="font-sans text-sm font-bold tracking-normal">Remarks history</h2>
        <pre className="mt-3 max-h-80 overflow-y-auto font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">{history || "No remarks yet."}</pre>
      </div>
    </aside>
  );
}
