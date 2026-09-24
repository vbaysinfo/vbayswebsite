import { Box, CalendarCheck, CheckCircle2, Eye, Factory, Grid3x3, Layers, PencilRuler, Ruler, Wrench } from "lucide-react";
import { WHY_CHOOSE_US } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONS = { factory: Factory, pencil: PencilRuler, box: Box, layers: Layers, eye: Eye, wrench: Wrench, calendar: CalendarCheck, ruler: Ruler, grid: Grid3x3, check: CheckCircle2 } as const;

export function WhyChooseUs() {
  return (
    <section className="section">
      <div className="container-x">
        <SectionHeading eyebrow="Why choose us" title="Design expertise, backed by real manufacturing" align="center" />
        <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {WHY_CHOOSE_US.map((w) => {
            const Icon = ICONS[w.icon as keyof typeof ICONS];
            return (
              <div key={w.title} className="bg-white p-6 md:p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brass-soft text-brass-dark"><Icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-5 font-sans text-base font-bold tracking-normal">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{w.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
