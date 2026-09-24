import { SmartImage } from "@/components/ui/SmartImage";

export function PageHero({ eyebrow, title, text, image, alt, children }: {
  eyebrow?: string; title: React.ReactNode; text?: React.ReactNode; image?: string; alt?: string; children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink pt-[4.5rem] text-white md:pt-20">
      {image && (
        <>
          <SmartImage src={image} alt={alt || ""} fill priority sizes="100vw" className="-z-10 object-cover opacity-60" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        </>
      )}
      <div className="container-x py-16 md:py-28">
        {eyebrow && <p className="eyebrow mb-5 text-brass-soft">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl leading-[1.08] font-medium md:text-6xl">{title}</h1>
        {text && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">{text}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
