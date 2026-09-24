import type { Metadata } from "next";
import Link from "next/link";
import { getContent, getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { WA_MESSAGES } from "@/lib/whatsapp";
import { PageHero } from "@/components/sections/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { ModularSolutions } from "@/components/sections/ModularSolutions";
import { MapCard } from "@/components/sections/MapCard";
import { CTABanner } from "@/components/sections/CTABanner";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({ title: `Modular Furniture Factory in ${s.defaultCity}`, description: `See how ${s.companyName} manufactures modular kitchens, wardrobes and furniture in our own factory — cutting, edge banding, CNC, assembly and quality checks.`, path: "/factory", image: s.factoryHeroImage });
}

export default async function FactoryPage() {
  const { settings, factory, gallery } = await getContent();
  const process = factory.filter((f) => f.type === "process");
  const capabilities = factory.filter((f) => f.type === "capability");
  const photos = [...factory.filter((f) => f.type === "image" && f.imageUrl).map((f) => ({ src: f.imageUrl, title: f.title })), ...gallery.filter((g) => g.category === "Factory").map((g) => ({ src: g.imageUrl, title: g.title }))];

  return (
    <>
      <PageHero
        eyebrow="Our factory"
        title={<>Designed by Experts. <em>Manufactured</em> in Our Factory.</>}
        text="Our in-house manufacturing facility allows us to coordinate design, production, quality and delivery through one system."
        image={settings.factoryHeroImage}
        alt="Modular furniture manufacturing facility"
      >
        <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.factory} label="Visit Our Factory" size="lg" />
        <Link href="/get-quote" className="btn btn-lg btn-ghost-light">Start Your Project</Link>
      </PageHero>

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Capabilities" title="Inside our production floor" text="Every panel is processed, finished and checked under one roof before it reaches your home." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <article key={c.id} className="card overflow-hidden">
                <div className="relative aspect-[16/10] bg-sand">
                  <SmartImage src={c.imageUrl} alt={`${c.title} at our factory`} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-sans text-lg font-bold tracking-normal">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{c.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grain section bg-espresso text-white">
        <div className="container-x">
          <SectionHeading light eyebrow="Factory process" title="15 steps from your requirement to installation" />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-white/10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {process.map((p, i) => (
              <li key={p.id} className="bg-espresso p-6">
                <span className="font-display text-3xl text-brass">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-3 font-semibold">{p.title}</p>
                {p.description && <p className="mt-1.5 text-sm leading-relaxed text-white/65">{p.description}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Factory gallery" title="Real machines. Real people. Real quality checks." />
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.slice(0, 8).map((ph, i) => (
                <div key={i} className={`relative overflow-hidden rounded-2xl bg-sand ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                  <SmartImage src={ph.src} alt={ph.title || "Factory"} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ModularSolutions />

      <section className="section bg-stone">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Visit us" title="See the materials, finishes and machines for yourself" text="Book a factory visit to see how your kitchen or wardrobe will be made. Walk through samples of boards, laminates, acrylics and hardware." />
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.factory} label="Book a Factory Visit" />
            </div>
          </div>
          <MapCard kind="factory" title="Our Factory" address={settings.factoryAddress} mapsUrl={settings.factoryMapsUrl} />
        </div>
      </section>
      <div className="pt-16 md:pt-24" />
      <CTABanner settings={settings} title="Start your project with a team that builds what it designs." />
    </>
  );
}
