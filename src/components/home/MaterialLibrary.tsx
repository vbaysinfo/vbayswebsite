import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

// Finish swatches rendered in pure CSS — a tactile, "material board" moment
// that looks refined even before real photography is added.
const MATERIALS = [
  { name: "American Walnut", note: "Veneer", bg: "repeating-linear-gradient(92deg,#5f3b21 0 3px,#6e4527 3px 9px,#553420 9px 12px,#7d5030 12px 20px)" },
  { name: "Graphite Matte", note: "PU shutter", bg: "linear-gradient(160deg,#565b60 0%,#4b5054 50%,#43474b 100%)" },
  { name: "Smoked Bronze", note: "Glass shutter", bg: "linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px),linear-gradient(170deg,rgba(210,170,110,.55) 0%,rgba(80,62,45,.85) 60%,rgba(45,38,32,.95) 100%)" },
  { name: "Warm Oak", note: "Laminate", bg: "repeating-linear-gradient(88deg,#c49a6a 0 4px,#cfa877 4px 11px,#b98f60 11px 14px,#d4b083 14px 24px)" },
  { name: "Statuario", note: "Quartz top", bg: "linear-gradient(125deg,transparent 40%,rgba(120,120,120,.35) 41%,transparent 43%),linear-gradient(35deg,transparent 60%,rgba(150,150,150,.3) 61%,transparent 62.5%),#f2f0ec" },
  { name: "Black Profile", note: "Handle & trim", bg: "repeating-linear-gradient(0deg,#1d1f21 0 18px,#2a2c2f 18px 20px)" },
  { name: "Ivory Linen", note: "Fabric panel", bg: "repeating-linear-gradient(0deg,rgba(0,0,0,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.035) 0 1px,transparent 1px 3px),#ede8df" },
  { name: "Warm LED Glow", note: "Profile lighting", bg: "radial-gradient(120% 70% at 50% 0%,#ffe2b0 0%,#d9a867 35%,#6e4527 80%,#3a2a1d 100%)" },
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
