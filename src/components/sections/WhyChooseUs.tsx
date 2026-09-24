import { Box, CalendarCheck, CheckCircle2, Eye, Factory, Grid3x3, Layers, PencilRuler, Ruler, Wrench } from "lucide-react";
import { WHY_CHOOSE_US } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const ICONS = { factory: Factory, pencil: PencilRuler, box: Box, layers: Layers, eye: Eye, wrench: Wrench, calendar: CalendarCheck, ruler: Ruler, grid: Grid3x3, check: CheckCircle2 } as const;

export function WhyChooseUs() {
  return (
    <section className="section">
      <div className="container-x grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow="Why choose us" title={<>Design expertise, backed by <em>real</em> manufacturing</>} text="One studio, one factory, one team — accountable for every detail from the first sketch to the final screw." />
        </div>
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2">
          {WHY_CHOOSE_US.map((w, i) => {
            const Icon = ICONS[w.icon as keyof typeof ICONS];
            return (
              <Reveal key={w.title} delay={(i % 2) * 90} className="group bg-paper p-7 transition-colors duration-500 hover:bg-white md:p-8">
                <Icon className="h-6 w-6 text-brass transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.4} aria-hidden />
                <h3 className="mt-5 text-2xl">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
