import { CUSTOMER_PROCESS } from "@/data/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ProcessTimeline() {
  return (
    <section className="section bg-stone">
      <div className="container-x">
        <SectionHeading
          eyebrow="How it works"
          title="Your project, step by step"
          text="A clear, transparent journey from the first conversation to the final handover — with our own factory in the middle."
        />
        <ol className="relative mt-14 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {CUSTOMER_PROCESS.map((step, i) => {
            const factory = step.includes("Factory") || step === "Quality Check";
            return (
              <li key={step} className="relative flex gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border font-display text-lg ${factory ? "border-brass bg-brass text-white" : "border-line bg-white text-ink"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-2.5">
                  <p className="font-semibold">{step}</p>
                  {factory && <p className="mt-0.5 text-xs font-semibold text-brass-dark">In our factory</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
