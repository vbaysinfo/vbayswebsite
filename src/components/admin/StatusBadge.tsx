import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  New: "bg-blue-50 text-blue-800 ring-blue-200",
  Contacted: "bg-slate-50 text-slate-700 ring-slate-200",
  "Follow-up": "bg-amber-50 text-amber-800 ring-amber-200",
  "Site Visit": "bg-violet-50 text-violet-800 ring-violet-200",
  Design: "bg-violet-50 text-violet-800 ring-violet-200",
  Quotation: "bg-orange-50 text-orange-800 ring-orange-200",
  Negotiation: "bg-orange-50 text-orange-800 ring-orange-200",
  Confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Completed: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  Lost: "bg-red-50 text-red-800 ring-red-200",
  // social
  Draft: "bg-slate-50 text-slate-700 ring-slate-200",
  Approved: "bg-blue-50 text-blue-800 ring-blue-200",
  Scheduled: "bg-violet-50 text-violet-800 ring-violet-200",
  Publishing: "bg-amber-50 text-amber-800 ring-amber-200",
  Published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Ready to Publish": "bg-orange-50 text-orange-800 ring-orange-200",
  Failed: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONE[status] || TONE.Draft)}>{status}</span>;
}
