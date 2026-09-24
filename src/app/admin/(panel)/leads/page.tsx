import { connection } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { listLeads } from "@/lib/server/backend";
import { getSettings } from "@/lib/server/content";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { istToday } from "@/lib/stats";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await connection();
  await requireSession();
  const sp = await searchParams;
  const [leads, settings] = await Promise.all([listLeads().catch(() => null), getSettings()]);
  if (!leads) {
    return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Could not load leads from Google Sheets. Please retry, or check the Apps Script deployment.</p>;
  }
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  return (
    <LeadsTable
      leads={leads}
      staff={settings.staffMembers}
      today={istToday()}
      initial={{ status: one(sp.status), source: one(sp.source), q: one(sp.q) }}
    />
  );
}
