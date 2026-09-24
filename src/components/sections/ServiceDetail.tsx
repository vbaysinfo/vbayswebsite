import Link from "next/link";
import { Check, Layers } from "lucide-react";
import type { Project, Service, Settings } from "@/lib/types";
import { withCity, SITE_URL, citySlug } from "@/lib/seo";
import { WA_MESSAGES } from "@/lib/whatsapp";
import { PageHero } from "./PageHero";
import { ProjectCard } from "./ProjectCard";
import { FAQList } from "./FAQ";
import { CTABanner } from "./CTABanner";
import { GalleryGrid } from "./GalleryGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { JsonLd } from "@/components/ui/JsonLd";
import { WhatsAppButton, CallButton } from "@/components/cta/TrackedLinks";
import { LeadForm } from "@/components/forms/LeadForm";
import { ViewEvent } from "@/components/layout/Trackers";
import { CUSTOMER_PROCESS, LEAD_OPTIONS } from "@/data/site";

function requirementFor(s: Service) {
  // Home services leave the choice (1/2/3BHK) to the visitor.
  const map: Record<string, string> = { Office: "Office", Commercial: "Commercial" };
  const r = map[s.category] || "";
  return LEAD_OPTIONS.requirement.includes(r) ? r : "";
}

export function ServiceDetail({ service: s, settings, projects, city, path }: { service: Service; settings: Settings; projects: Project[]; city: string; path: string }) {
  const h1 = withCity(s.h1 || `${s.serviceName} in {city}`, city);
  const waMessage = s.whatsappMessage || WA_MESSAGES.service(s.serviceName);
  const related = projects.filter((p) => p.serviceSlug === s.slug || p.category === s.category).slice(0, 3);
  const galleryItems = s.galleryImages.map((src, i) => ({ id: `${s.slug}-${i}`, src, title: `${s.serviceName} design ${i + 1}`, category: s.category }));
  const faqs = s.faqs.map((f) => ({ q: withCity(f.q, city), a: withCity(f.a, city) }));

  return (
    <>
      <ViewEvent event="service_view" service={s.slug} label={city} />
      <PageHero eyebrow={s.category || "Interiors"} title={h1} text={s.shortDescription} image={s.mainImage} alt={s.imageAlt}>
        <Link href="#enquire" className="btn btn-lg btn-light">Get Free Consultation</Link>
        <WhatsAppButton number={settings.whatsappNumber} message={waMessage} label="Get Quote on WhatsApp" service={s.slug} size="lg" />
      </PageHero>

      <nav aria-label="Breadcrumb" className="container-x py-4 text-sm text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/interiors" className="hover:text-ink">Interiors</Link> / <span className="text-ink">{s.serviceName}</span>
      </nav>

      <section className="pb-16 md:pb-24">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Overview" title={`${s.serviceName}, designed and manufactured by one team`} />
            <div className="prose-body mt-6 text-lg">
              {s.fullDescription.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {s.startingPrice && <p className="mt-4 rounded-2xl bg-stone px-5 py-4 text-ink-soft">Starting from <strong className="text-ink">{s.startingPrice}</strong> <span className="text-sm text-muted">· final price depends on size, materials and finishes</span></p>}
            {s.benefits.length > 0 && (
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {s.benefits.map((b) => <li key={b} className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-semibold"><Check className="h-5 w-5 shrink-0 text-brass" aria-hidden />{b}</li>)}
              </ul>
            )}
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-sand">
            <SmartImage src={s.galleryImages[0] || s.mainImage} alt={s.imageAlt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {s.designExamples.length > 0 && (
        <section className="section bg-stone">
          <div className="container-x">
            <SectionHeading eyebrow="Design options" title={`Popular ${s.serviceName.toLowerCase()} layouts`} />
            <div className="mt-10 flex flex-wrap gap-3">
              {s.designExamples.map((d) => (
                <WhatsAppButton key={d} number={settings.whatsappNumber} message={`Hello, I am interested in a ${d} (${s.serviceName}). Please share ideas.`} service={s.slug} label={d} variant="link" className="!text-ink rounded-full border border-line bg-white px-5 py-3 !font-semibold hover:!border-brass hover:!no-underline">
                  <Layers className="h-4 w-4 text-brass" />{d}
                </WhatsAppButton>
              ))}
            </div>
          </div>
        </section>
      )}

      {galleryItems.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Gallery" title="Design inspiration" />
            <div className="mt-8"><GalleryGrid items={galleryItems} categories={["All"]} whatsappNumber={settings.whatsappNumber} /></div>
          </div>
        </section>
      )}

      <section className="section bg-ink text-white">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading light eyebrow="Process" title="From consultation to installation" />
            <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {CUSTOMER_PROCESS.map((p, i) => <li key={p} className="flex gap-3"><span className="font-display text-brass">{String(i + 1).padStart(2, "0")}</span>{p}</li>)}
            </ol>
          </div>
          <div>
            <SectionHeading light eyebrow="Materials" title="Built to last" />
            <ul className="mt-8 space-y-3 text-white/85">
              {s.materials.map((m) => <li key={m} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden />{m}</li>)}
            </ul>
            <Link href="/factory" className="btn btn-ghost-light mt-8">See how we manufacture</Link>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Related projects" title={`Recent ${s.serviceName.toLowerCase()} projects`} />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <ProjectCard key={p.projectId} project={p} whatsappNumber={settings.whatsappNumber} />)}</div>
          </div>
        </section>
      )}

      <section id="enquire" className="section scroll-mt-20 bg-stone">
        <div className="container-x grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="Free consultation" title={`Planning ${s.serviceName.toLowerCase()}?`} text="Share a few details and our designer will get in touch. Prefer to chat? Message us on WhatsApp." />
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton number={settings.whatsappNumber} message={waMessage} label="Chat on WhatsApp" service={s.slug} />
              <CallButton phone={settings.phone} service={s.slug} />
            </div>
            {faqs.length > 0 && <div className="mt-12"><h2 className="mb-5 text-2xl font-medium">Frequently asked questions</h2><FAQList items={faqs} /></div>}
          </div>
          <div className="card p-6 md:p-10">
            <LeadForm heading={`Get a free ${s.serviceName.toLowerCase()} consultation`} initialRequirement={requirementFor(s)} contact={{ whatsappNumber: settings.whatsappNumber, phone: settings.phone, defaultCity: city }} compact />
          </div>
        </div>
      </section>

      {settings.serviceAreas.length > 1 && (
        <section className="pb-12">
          <div className="container-x text-sm text-muted">
            <span className="font-semibold text-ink">{s.serviceName} across the region: </span>
            {settings.serviceAreas.map((c, i) => (
              <span key={c}>{i > 0 && " · "}<Link href={`/interiors/${s.slug}/${citySlug(c)}`} className="hover:text-ink hover:underline">{s.serviceName} in {c}</Link></span>
            ))}
          </div>
        </section>
      )}

      <CTABanner settings={settings} message={waMessage} />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: h1,
            serviceType: s.serviceName,
            description: s.seoDescription ? withCity(s.seoDescription, city) : s.shortDescription,
            image: s.mainImage || undefined,
            areaServed: { "@type": "City", name: city },
            provider: { "@id": `${SITE_URL}/#business` },
            url: `${SITE_URL}${path}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Interiors", item: `${SITE_URL}/interiors` },
              { "@type": "ListItem", position: 3, name: s.serviceName, item: `${SITE_URL}/interiors/${s.slug}` },
            ],
          },
          ...(faqs.length
            ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
            : []),
        ]}
      />
    </>
  );
}
