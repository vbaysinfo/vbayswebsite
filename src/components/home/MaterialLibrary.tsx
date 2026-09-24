import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

// Finish swatches rendered in pure CSS — a tactile, "material board" moment
// that looks refined even before real photography is added.
const MATERIALS = [
  { name: "American Walnut", note: "Veneer", bg: "repeating-linear-gradient(92deg,#5b3a24 0 3px,#6a4429 3px 9px,#50331f 9px 12px,#734b2e 12px 20px)" },
  { name: "Natural Oak", note: "Laminate", bg: "repeating-linear-gradient(88deg,#c9a57a 0 4px,#d4b389 4px 11px,#bf9b70 11px 14px,#d9ba92 14px 24px)" },
  { name: "Statuario", note: "Quartz top", bg: "linear-gradient(125deg,transparent 40%,rgba(120,120,120,.35) 41%,transparent 43%),linear-gradient(35deg,transparent 60%,rgba(150,150,150,.3) 61%,transparent 62.5%),#f2f0ec" },
  { name: "Champagne", note: "Brushed metal", bg: "repeating-linear-gradient(90deg,#c8a86e 0 1px,#d8bc86 1px 3px,#b8965c 3px 4px),linear-gradient(135deg,#e2c995,#a88348)" },
  { name: "Sage Matte", note: "PU finish", bg: "radial-gradient(circle at 30% 30%,#a3ad96,#7f8a72)" },
  { name: "Ivory Linen", note: "Fabric panel", bg: "repeating-linear-gradient(0deg,rgba(0,0,0,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.035) 0 1px,transparent 1px 3px),#ede4d4" },
  { name: "Graphite", note: "Acrylic gloss", bg: "linear-gradient(160deg,#4a4845 0%,#2b2a28 55%,#3d3b38 100%)" },
  { name: "Terrazzo", note: "Accent", bg: "radial-gradient(circle at 20% 30%,#c47f5b 0 3px,transparent 3.5px) 0 0/46px 46px,radial-gradient(circle at 70% 65%,#6d7f73 0 4px,transparent 4.5px) 0 0/58px 58px,radial-gradient(circle at 45% 80%,#d8b27a 0 2.5px,transparent 3px) 0 0/38px 38px,radial-gradient(circle at 85% 20%,#9a9a94 0 2px,transparent 2.5px) 0 0/30px 30px,#ece6dc" },
];

export function MaterialLibrary() {
  return (
    <section className="section overflow-hidden bg-stone">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Material library"
            title={<>Finishes you can <em>touch</em> before we build</>}
            text="Veneers, laminates, acrylics, quartz and hardware — curated with your designer and processed in our own factory."
          />
          <Link href="/factory" className="btn btn-outline shrink-0">Visit the Factory</Link>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
          {MATERIALS.map((m, i) => (
            <Reveal key={m.name} delay={(i % 4) * 90} className="group">
              <div
                className={`aspect-[4/5] w-full shadow-soft ring-1 ring-black/5 transition-transform duration-700 group-hover:-translate-y-2 ${i % 2 ? "rounded-t-[999px] rounded-b-xl" : "rounded-xl"}`}
                style={{ background: m.bg }}
                role="img"
                aria-label={`${m.name} finish swatch`}
              />
              <p className="mt-4 font-display text-xl">{m.name}</p>
              <p className="text-xs tracking-[0.22em] text-muted uppercase">{m.note}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
