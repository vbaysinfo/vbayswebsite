import { Check, Minus } from "lucide-react";
import { DESIGN_ONLY_VS_COMPLETE, MODULAR_SOLUTIONS } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ModularSolutions() {
  return (
    <section className="section bg-stone">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Complete modular interiors"
            title={<>Everything modular, <em>made</em> in one place</>}
            text="From kitchens to lofts, every modular unit is designed by our studio and produced in our own factory to your exact measurements."
          />
          <ul className="mt-9 flex flex-wrap gap-2">
            {MODULAR_SOLUTIONS.map((m) => (
              <li key={m} className="rounded-full border border-line px-4 py-2 text-xs tracking-[0.12em] text-ink-soft uppercase">{m}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-line bg-paper p-8">
            <p className="text-[0.68rem] font-medium tracking-[0.24em] text-muted uppercase">Design only</p>
            <p className="mt-3 font-display text-3xl">Drawings — then you&apos;re on your own</p>
            <ul className="mt-6 space-y-3.5 text-sm text-ink-soft">
              {DESIGN_ONLY_VS_COMPLETE.designOnly.map((t) => (
                <li key={t} className="flex gap-3"><Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
          <div className="grain rounded-[var(--radius-card)] bg-espresso p-8 text-white shadow-lift">
            <p className="text-[0.68rem] font-medium tracking-[0.24em] text-brass-soft uppercase">Design + Manufacturing + Installation</p>
            <p className="mt-3 font-display text-3xl">One team, start to finish</p>
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
