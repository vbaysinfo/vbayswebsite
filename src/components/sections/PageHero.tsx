import { SmartImage } from "@/components/ui/SmartImage";

/** Inner-page hero: dark editorial panel with an arched image on the right. */
export function PageHero({ eyebrow, title, text, image, alt, children }: {
  eyebrow?: string; title: React.ReactNode; text?: React.ReactNode; image?: string; alt?: string; children?: React.ReactNode;
}) {
  return (
    <section className="grain relative isolate overflow-hidden bg-espresso pt-[4.75rem] text-white md:pt-[5.5rem]">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-brass/10 blur-3xl" />
      <div className="container-x grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="animate-fade-up">
          {eyebrow && <p className="eyebrow mb-6 text-brass">{eyebrow}</p>}
          <h1 className="max-w-3xl text-5xl leading-[1.02] md:text-7xl [&_em]:gold-italic">{title}</h1>
          {text && <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70">{text}</p>}
          {children && <div className="mt-10 flex flex-wrap gap-3">{children}</div>}
        </div>
        {image && (
          <div className="relative mx-auto hidden w-full max-w-sm lg:block">
            <div aria-hidden className="absolute -right-4 -top-4 bottom-4 left-4 rounded-[999px_999px_1.25rem_1.25rem] border border-brass/50" />
            <div className="arch relative aspect-[3/4] bg-sand">
              <SmartImage src={image} alt={alt || ""} fill priority sizes="30vw" className="object-cover" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
