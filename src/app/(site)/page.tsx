import Link from "next/link";
import { ArrowRight, Check, Factory } from "lucide-react";
import { getContent, getInstagramMedia } from "@/lib/server/content";
import { BRAND, TRUST_POINTS } from "@/data/site";
import { WA_MESSAGES } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/SmartImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { LeadForm } from "@/components/forms/LeadForm";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { ModularSolutions } from "@/components/sections/ModularSolutions";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Testimonials } from "@/components/sections/Testimonials";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { GoogleReviewsCTA } from "@/components/sections/GoogleReviewsCTA";
import { CTABanner } from "@/components/sections/CTABanner";

export default async function HomePage() {
  const [{ settings, services, projects, beforeAfter, testimonials, factory, gallery }, instagram] = await Promise.all([
    getContent(),
    getInstagramMedia(),
  ]);
  const featuredServices = (services.filter((s) => s.featured).length >= 3 ? services.filter((s) => s.featured) : services).slice(0, 6);
  const featuredProjects = (projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects).slice(0, 5);
  const capabilities = factory.filter((f) => f.type === "capability").slice(0, 6);
  const ba = beforeAfter[0];
  const kitchen = services.find((s) => s.slug === "modular-kitchen");
  const wardrobe = services.find((s) => s.slug === "wardrobes");
  const stats = [
    settings.yearsExperience && { v: settings.yearsExperience, l: "Years of experience" },
    settings.projectsCompleted && { v: settings.projectsCompleted, l: "Projects completed" },
    settings.factoryArea && { v: settings.factoryArea, l: "Factory facility" },
  ].filter(Boolean) as { v: string; l: string }[];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink text-white">
        <SmartImage src={settings.heroImage} alt="Premium modular interior designed and manufactured by our team" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
        <div className="container-x pb-14 pt-32 md:pb-20">
          <div className="max-w-4xl animate-fade-up">
            <p className="eyebrow text-brass-soft">Design → Manufacturing → Installation</p>
            <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-medium sm:text-6xl lg:text-7xl">{BRAND.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">{BRAND.subheadline}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="#consultation" className="btn btn-lg bg-white text-ink hover:bg-brass-soft">
                {settings.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <WhatsAppButton number={settings.whatsappNumber} message={settings.whatsappDefaultMessage} label={settings.secondaryCta} size="lg" />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
            {[
              { src: kitchen?.mainImage, label: "Modular Kitchens", href: "/interiors/modular-kitchen" },
              { src: wardrobe?.mainImage, label: "Wardrobes", href: "/interiors/wardrobes" },
              { src: settings.factoryHeroImage, label: "Our Factory", href: "/factory" },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/20">
                <SmartImage src={t.src} alt={t.label} fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <span className="absolute bottom-2 left-2.5 text-[0.7rem] font-bold sm:text-xs">{t.label}</span>
              </Link>
            ))}
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/15 pt-8 text-sm text-white/85 md:grid-cols-3 lg:grid-cols-6">
            {TRUST_POINTS.map((t) => (
              <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Lead form ──────────────────────────────────────── */}
      <section id="consultation" className="section scroll-mt-16 bg-stone">
        <div className="container-x grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Free consultation"
              title="Let's Design Your Dream Space"
              text="Tell us about your space in six quick steps. A designer will call you back with ideas, a site-visit slot and next steps — no obligation."
            />
            <ul className="mt-8 space-y-3 text-ink-soft">
              {["Talk to a designer, not a call centre", "Share your floor plan for a faster estimate", "Visit our factory to see materials and finishes"].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden />{t}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.floorPlan} label="Send Your Floor Plan" variant="link" />
              <span className="text-line">|</span>
              <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.designer} label="Talk to Our Designer" variant="link" />
            </div>
          </div>
          <div className="card p-6 md:p-10">
            <LeadForm heading="" contact={{ whatsappNumber: settings.whatsappNumber, phone: settings.phone, defaultCity: settings.defaultCity }} />
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────── */}
      <section className="section">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Interiors" title="Interior Solutions Designed Around You" text="Every room planned in 3D, every modular unit manufactured in our factory." />
            <Link href="/interiors" className="btn btn-outline shrink-0">All Interior Services <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s) => <ServiceCard key={s.serviceId} service={s} whatsappNumber={settings.whatsappNumber} />)}
          </div>
        </div>
      </section>

      <ModularSolutions />

      {/* ── Factory ────────────────────────────────────────── */}
      <section className="section bg-ink text-white">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <SmartImage src={settings.factoryHeroImage} alt="Our modular manufacturing facility" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading light eyebrow="Our factory" title="Designed by Experts. Manufactured in Our Factory." text="Our in-house manufacturing facility allows us to coordinate design, production, quality and delivery through one system." />
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {capabilities.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold"><Factory className="h-4 w-4 text-brass" aria-hidden />{c.title}</li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/factory" className="btn btn-lg bg-white text-ink hover:bg-brass-soft">Visit Our Factory</Link>
              <Link href="/get-quote" className="btn btn-lg btn-ghost-light">Start Your Project</Link>
            </div>
          </div>
        </div>
        {stats.length > 0 && (
          <div className="container-x mt-16 grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.l}><p className="font-display text-4xl text-brass-soft">{s.v}</p><p className="mt-1 text-sm text-white/70">{s.l}</p></div>
            ))}
          </div>
        )}
      </section>

      {/* ── Projects ───────────────────────────────────────── */}
      {featuredProjects.length > 0 && (
        <section className="section">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow="Completed projects" title="Spaces we've designed, built and installed" />
              <Link href="/projects" className="btn btn-outline shrink-0">View All Projects <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((p, i) => <ProjectCard key={p.projectId} project={p} className={i === 0 ? "lg:col-span-2 lg:row-span-2 [&>div]:lg:aspect-auto [&>div]:lg:h-full" : ""} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Before / After ─────────────────────────────────── */}
      {ba && (
        <section className="section bg-stone">
          <div className="container-x grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
            <BeforeAfterSlider before={ba.beforeImage} after={ba.afterImage} alt={ba.projectName} />
            <div>
              <SectionHeading eyebrow="Before & after" title={ba.projectName} text={ba.description} />
              {ba.location && <p className="mt-3 text-sm text-muted">{[ba.category, ba.location].filter(Boolean).join(" · ")}</p>}
              <p className="mt-8 font-display text-2xl">Want a Similar Transformation?</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/get-quote" className="btn btn-primary">Get Free Consultation</Link>
                <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.similar(ba.projectName)} label="Get Similar Design" />
              </div>
            </div>
          </div>
        </section>
      )}

      <ProcessTimeline />
      <WhyChooseUs />
      <Testimonials items={testimonials} />
      <InstagramSection settings={settings} media={instagram} fallbackImages={gallery.map((g) => g.imageUrl)} />
      <GoogleReviewsCTA settings={settings} />
      <CTABanner settings={settings} title={BRAND.statement} />
    </>
  );
}
