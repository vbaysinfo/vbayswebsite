import { Check, Minus } from "lucide-react";
import { DESIGN_ONLY_VS_COMPLETE, MODULAR_SOLUTIONS } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ModularSolutions() {
  return (
    <section className="section">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Complete modular interiors"
            title="Everything modular, made in one place"
            text="From kitchens to lofts, every modular unit is designed by our studio and produced in our own factory to your exact measurements."
          />
          <ul className="mt-9 flex flex-wrap gap-2">
            {MODULAR_SOLUTIONS.map((m) => (
              <li key={m} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft">{m}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-line bg-stone p-7">
            <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Design only</p>
            <p className="mt-2 font-display text-2xl">Drawings — then you&apos;re on your own</p>
            <ul className="mt-6 space-y-3.5 text-sm text-ink-soft">
              {DESIGN_ONLY_VS_COMPLETE.designOnly.map((t) => (
                <li key={t} className="flex gap-3"><Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-card)] bg-ink p-7 text-white shadow-lift">
            <p className="text-xs font-bold tracking-[0.16em] text-brass-soft uppercase">Design + Manufacturing + Installation</p>
            <p className="mt-2 font-display text-2xl">One team, start to finish</p>
            <ul className="mt-6 space-y-3.5 text-sm text-white/85">
              {DESIGN_ONLY_VS_COMPLETE.complete.map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
