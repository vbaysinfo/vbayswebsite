import { DESIGN_SERVICES } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function DesignServices() {
  return (
    <section className="section bg-stone">
      <div className="container-x">
        <SectionHeading eyebrow="Design services" title="Thoughtful design before a single panel is cut" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGN_SERVICES.map((d, i) => (
            <div key={d.title} className="rounded-2xl border border-line bg-white p-6">
              <span className="font-display text-sm text-brass">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 font-sans text-lg font-bold tracking-normal">{d.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
