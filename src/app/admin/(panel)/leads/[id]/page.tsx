import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, FileText } from "lucide-react";
import { requireSession } from "@/lib/server/auth";
import { getLead } from "@/lib/server/backend";
import { getSettings } from "@/lib/server/content";
import { LeadEditor } from "@/components/admin/LeadEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { istToday } from "@/lib/stats";

export const metadata = { title: "Lead" };

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await connection();
  await requireSession();
  const { id } = await params;
  const [lead, settings] = await Promise.all([getLead(decodeURIComponent(id)), getSettings()]);
  if (!lead) notFound();
  const files = lead.fileUrl.split(/\n/).filter(Boolean);
  const rows: [string, string][] = [
    ["Phone", lead.phone], ["WhatsApp", lead.whatsapp], ["Email", lead.email], ["City", lead.city],
    ["Requirement", lead.requirement], ["Property type", lead.propertyType], ["Property status", lead.propertyStatus], ["Budget", lead.budget],
    ["Preferred contact", lead.preferredContact], ["Received", `${lead.date} ${lead.time}`],
    ["Source", lead.source], ["Campaign", lead.campaign], ["UTM source", lead.utmSource], ["UTM medium", lead.utmMedium], ["UTM campaign", lead.utmCampaign], ["UTM content", lead.utmContent],
  ];
  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />All leads</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-medium">{lead.name}</h1>
        <StatusBadge status={lead.status} />
        <span className="font-mono text-sm text-muted">{lead.leadId}</span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-sans text-sm font-bold tracking-normal">Customer & requirement</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold break-words">{v || "—"}</dd></div>)}
            </dl>
            {lead.message && <div className="mt-5 rounded-xl bg-stone p-4 text-sm whitespace-pre-wrap">{lead.message}</div>}
          </section>
          <section className="card p-6">
            <h2 className="font-sans text-sm font-bold tracking-normal">Uploaded files</h2>
            {files.length === 0 ? <p className="mt-3 text-sm text-muted">No files uploaded.</p> : (
              <ul className="mt-3 space-y-2">
                {files.map((f) => (
                  <li key={f}>
                    {f.startsWith("https://") ? (
                      <a href={f} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brass-dark hover:underline"><FileText className="h-4 w-4" />{f.includes("floorPlan") ? "Floor plan" : "Reference image"} (private Google Drive link)</a>
                    ) : <span className="inline-flex items-center gap-2 text-sm text-muted"><FileText className="h-4 w-4" />{f}</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">Files are stored in a private Drive folder — only accounts you share it with can open them.</p>
          </section>
        </div>
        <LeadEditor lead={lead} staff={settings.staffMembers} today={istToday()} />
      </div>
    </div>
  );
}
