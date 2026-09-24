import { CUSTOMER_PROCESS } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** 13-step journey as a horizontal, scroll-snapping timeline with a gold rail. */
export function ProcessTimeline() {
  return (
    <section className="section overflow-hidden bg-stone">
      <div className="container-x">
        <SectionHeading eyebrow="How it works" title={<>Your project, <em>step by step</em></>} text="A transparent journey from the first conversation to the final handover — with our own factory at its heart." />
      </div>
      <div className="mt-16 overflow-x-auto pb-6 [scrollbar-width:thin]">
        <ol className="relative flex w-max snap-x snap-mandatory gap-0 px-5 md:px-10 xl:mx-auto">
          <span aria-hidden className="absolute left-0 right-0 top-[1.6rem] h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent" />
          {CUSTOMER_PROCESS.map((step, i) => {
            const factory = step.includes("Factory") || step === "Quality Check";
            return (
              <li key={step} className="relative w-44 shrink-0 snap-start pr-6 md:w-52">
                <span className={`relative z-10 grid h-[3.2rem] w-[3.2rem] place-items-center rounded-full border font-display text-lg ${factory ? "border-brass bg-brass text-white" : "border-line bg-paper text-ink"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-5 font-display text-2xl leading-tight">{step}</p>
                {factory && <p className="mt-1 text-[0.65rem] tracking-[0.25em] text-brass-dark uppercase">In our factory</p>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
