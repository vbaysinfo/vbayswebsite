import Link from "next/link";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { getContent, getInstagramMedia } from "@/lib/server/content";
import { BRAND, TRUST_POINTS } from "@/data/site";
import { WA_MESSAGES } from "@/lib/whatsapp";
import { SmartImage } from "@/components/ui/SmartImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { LeadForm } from "@/components/forms/LeadForm";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { ModularSolutions } from "@/components/sections/ModularSolutions";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Testimonials } from "@/components/sections/Testimonials";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { GoogleReviewsCTA } from "@/components/sections/GoogleReviewsCTA";
import { CTABanner } from "@/components/sections/CTABanner";
import { RotatingBadge } from "@/components/home/RotatingBadge";
import { Marquee } from "@/components/home/Marquee";
import { ServiceIndex } from "@/components/home/ServiceIndex";
import { MaterialLibrary } from "@/components/home/MaterialLibrary";
import { Triptych } from "@/components/home/Triptych";

export default async function HomePage() {
  const [{ settings, services, projects, beforeAfter, testimonials, gallery }, instagram] = await Promise.all([
    getContent(),
    getInstagramMedia(),
  ]);
  const featuredServices = (services.filter((s) => s.featured).length >= 3 ? services.filter((s) => s.featured) : services).slice(0, 6);
  const featuredProjects = (projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects).slice(0, 5);
  const ba = beforeAfter[0];
  const kitchen = services.find((s) => s.slug === "modular-kitchen");
  const stats = [
    settings.yearsExperience && { v: settings.yearsExperience, l: "Years of craft" },
    settings.projectsCompleted && { v: settings.projectsCompleted, l: "Spaces delivered" },
    settings.factoryArea && { v: settings.factoryArea, l: "In-house factory" },
  ].filter(Boolean) as { v: string; l: string }[];

  return (
    <>
      {/* ── Hero: editorial split with arched image ─────────────── */}
      <section className="grain relative overflow-hidden bg-espresso text-white">
        <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 h-[36rem] w-[36rem] rounded-full bg-brass/10 blur-3xl" />
        <div className="container-x grid min-h-[100svh] items-center gap-14 pb-20 pt-32 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pt-36">
          <div className="animate-fade-up">
            <p className="eyebrow text-brass">Design → Manufacturing → Installation</p>
            <h1 className="mt-7 text-[3.1rem] leading-[0.98] sm:text-7xl xl:text-[5.6rem]">
              Complete Interior Solutions, <em className="gold-italic">Designed</em> for Your Space.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">{BRAND.subheadline}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="#consultation" className="btn btn-lg btn-light">
                {settings.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <WhatsAppButton number={settings.whatsappNumber} message={settings.whatsappDefaultMessage} label={settings.secondaryCta} size="lg" />
            </div>
            <ul className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-sm text-white/70">
              {TRUST_POINTS.map((t) => (
                <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[30rem] lg:ml-auto lg:mr-0">
            <div aria-hidden className="absolute -right-4 -top-4 bottom-6 left-6 rounded-[999px_999px_1.5rem_1.5rem] border border-brass/50" />
            <div className="arch relative aspect-[4/5] bg-sand shadow-lift">
              <SmartImage src={settings.heroImage} alt="Luxury modular interior designed and manufactured by our studio" fill priority sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-8 -left-2 w-36 overflow-hidden rounded-2xl border-4 border-espresso shadow-lift sm:-left-12 sm:w-52">
              <div className="relative aspect-square bg-sand">
                <SmartImage src={kitchen?.mainImage} alt="Modular kitchen" fill sizes="220px" className="object-cover" />
              </div>
            </div>
            <RotatingBadge className="absolute -left-3 top-8 sm:-left-16" />
          </div>
        </div>
        <a href="#consultation" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] tracking-[0.3em] text-white/50 uppercase lg:flex">
          Scroll <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      <Marquee items={services.map((s) => s.serviceName)} />

      {/* ── Consultation form ───────────────────────────────────── */}
      <section id="consultation" className="section scroll-mt-16">
        <div className="container-x grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              eyebrow="Free consultation"
              title={<>Let&apos;s Design Your <em>Dream</em> Space</>}
              text="Six quick steps. A designer calls you back with ideas, a site-visit slot and next steps — no obligation."
            />
            <ul className="mt-10 space-y-4 text-ink-soft">
              {["Talk to a designer, not a call centre", "Share your floor plan for a faster estimate", "Visit our factory to see materials and finishes"].map((t, i) => (
                <li key={t} className="flex items-baseline gap-4"><span className="font-display text-lg text-brass">0{i + 1}</span>{t}</li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.floorPlan} label="Send Your Floor Plan" variant="link" />
              <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.designer} label="Talk to Our Designer" variant="link" />
            </div>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-br from-brass/25 via-transparent to-brass/10" />
            <div className="card p-6 md:p-10">
              <LeadForm heading="" contact={{ whatsappNumber: settings.whatsappNumber, phone: settings.phone, defaultCity: settings.defaultCity }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Statement ───────────────────────────────────────────── */}
      <section className="bg-stone py-20 md:py-28">
        <div className="container-x">
          <Reveal className="mx-auto max-w-5xl text-center">
            <span className="font-display text-7xl leading-none text-brass" aria-hidden>“</span>
            <p className="font-display text-3xl leading-snug text-ink md:text-5xl md:leading-[1.15]">
              We don&apos;t just design interiors — we <em className="gold-italic">design, manufacture and install</em> complete modular interiors.
            </p>
            {stats.length > 0 && (
              <div className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.l}><p className="font-display text-5xl text-brass-dark">{s.v}</p><p className="mt-1 text-xs tracking-[0.25em] text-muted uppercase">{s.l}</p></div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── Services index ──────────────────────────────────────── */}
      <section className="section">
        <div className="container-x">
          <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading eyebrow="Interiors" title={<>Interior Solutions <em>Designed</em> Around You</>} />
            <Link href="/interiors" className="btn btn-outline shrink-0">All Services <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ServiceIndex services={featuredServices} />
        </div>
      </section>

      {/* ── Factory triptych ────────────────────────────────────── */}
      <section className="grain section bg-espresso text-white">
        <div className="container-x">
          <div className="grid items-end gap-12 lg:grid-cols-[1fr_0.8fr]">
            <SectionHeading light eyebrow="Our factory" title={<>Designed by Experts. <em>Manufactured</em> in Our Factory.</>} text="Our in-house manufacturing facility allows us to coordinate design, production, quality and delivery through one system." />
            <div className="relative aspect-[16/11] overflow-hidden rounded-[var(--radius-card)]">
              <SmartImage src={settings.factoryHeroImage} alt="Our modular manufacturing facility" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
          <div className="mt-16"><Triptych /></div>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link href="/factory" className="btn btn-lg btn-light">Visit Our Factory</Link>
            <Link href="/get-quote" className="btn btn-lg btn-ghost-light">Start Your Project</Link>
          </div>
        </div>
      </section>

      {/* ── Projects mosaic ─────────────────────────────────────── */}
      {featuredProjects.length > 0 && (
        <section className="section">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <SectionHeading eyebrow="Portfolio" title={<>Spaces we&apos;ve <em>crafted</em></>} text="Designed in our studio, built in our factory, installed by our team." />
              <Link href="/projects" className="btn btn-outline shrink-0">View All Projects <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((p, i) => (
                <Reveal key={p.projectId} delay={(i % 3) * 100} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
                  <ProjectCard project={p} variant={i === 0 ? "feature" : i === 2 ? "arch" : "default"} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <MaterialLibrary />

      {/* ── Before / After ──────────────────────────────────────── */}
      {ba && (
        <section className="section">
          <div className="container-x grid items-center gap-14 lg:grid-cols-[1.4fr_1fr]">
            <BeforeAfterSlider before={ba.beforeImage} after={ba.afterImage} alt={ba.projectName} />
            <div>
              <SectionHeading eyebrow="Before & after" title={<>{ba.projectName}</>} text={ba.description} />
              {ba.location && <p className="mt-4 text-xs tracking-[0.25em] text-muted uppercase">{[ba.category, ba.location].filter(Boolean).join(" · ")}</p>}
              <p className="mt-10 font-display text-3xl">Want a Similar <span className="gold-italic">Transformation?</span></p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/get-quote" className="btn btn-primary">Get Free Consultation</Link>
                <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.similar(ba.projectName)} label="Get Similar Design" />
              </div>
            </div>
          </div>
        </section>
      )}

      <ModularSolutions />
      <ProcessTimeline />
      <WhyChooseUs />
      <Testimonials items={testimonials} />
      <InstagramSection settings={settings} media={instagram} fallbackImages={gallery.map((g) => g.imageUrl)} />
      <GoogleReviewsCTA settings={settings} />
      <CTABanner settings={settings} image={settings.heroImage} />
    </>
  );
}
