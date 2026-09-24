import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";

/** Renders only admin-approved testimonials (Active = TRUE). Hidden when none exist. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="section bg-stone">
      <div className="container-x">
        <SectionHeading eyebrow="Client stories" title="What our clients say" />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((t) => (
            <figure key={t.testimonialId} className="card flex flex-col p-7">
              <Quote className="h-7 w-7 text-brass" aria-hidden />
              {t.rating > 0 && (
                <div className="mt-4 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-brass text-brass" : "text-line"}`} aria-hidden />)}
                </div>
              )}
              <blockquote className="mt-4 flex-1 leading-relaxed text-ink-soft">“{t.review}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                {t.photo && <span className="relative h-11 w-11 overflow-hidden rounded-full"><SmartImage src={t.photo} alt={t.customerName} fill sizes="44px" className="object-cover" /></span>}
                <span>
                  <span className="block font-semibold">{t.customerName}</span>
                  <span className="block text-sm text-muted">{[t.projectType, t.location].filter(Boolean).join(" · ")}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
