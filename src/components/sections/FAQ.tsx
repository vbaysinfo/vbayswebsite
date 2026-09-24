import { Plus } from "lucide-react";
import type { FAQ as F } from "@/lib/types";

export function FAQList({ items }: { items: F[] }) {
  return (
    <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
      {items.map((f) => (
        <details key={f.q} className="group p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="mt-0.5 h-5 w-5 shrink-0 text-brass transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
