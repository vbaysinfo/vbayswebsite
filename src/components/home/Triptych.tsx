import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  { n: "01", title: "Design", text: "Space planning, 2D layouts and photo-real 3D — every detail approved by you before production." },
  { n: "02", title: "Manufacture", text: "Precision cutting, edge banding, CNC and assembly in our own factory, with quality checks at every stage." },
  { n: "03", title: "Install", text: "Our trained team delivers and installs on schedule — one team, one point of contact, one standard." },
];

/** The brand promise as three editorial columns with outlined numerals. */
export function Triptych() {
  return (
    <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-white/10 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <Reveal key={s.n} delay={i * 120} className="bg-espresso p-8 md:p-10">
          <span className="numeral text-7xl md:text-8xl">{s.n}</span>
          <h3 className="mt-6 text-4xl text-white">{s.title}</h3>
          <div className="my-5 h-px w-12 bg-brass" />
          <p className="leading-relaxed text-white/65">{s.text}</p>
        </Reveal>
      ))}
    </div>
  );
}
