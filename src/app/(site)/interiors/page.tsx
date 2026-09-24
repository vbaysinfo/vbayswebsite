import type { Metadata } from "next";
import Link from "next/link";
import { getContent, getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { DesignServices } from "@/components/sections/DesignServices";
import { ModularSolutions } from "@/components/sections/ModularSolutions";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { CTABanner } from "@/components/sections/CTABanner";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({
    title: `Interior Design Services in ${s.defaultCity}`,
    description: `Modular kitchens, wardrobes, bedrooms, living rooms, office and commercial interiors in ${s.defaultCity} — designed in 3D and manufactured in our own factory.`,
    path: "/interiors",
  });
}

export default async function InteriorsPage() {
  const { settings, services } = await getContent();
  return (
    <>
      <PageHero
        eyebrow="Interior services"
        title={<>Interior Solutions <em>Designed</em> Around You</>}
        text="Complete home, modular and commercial interiors — planned by our designers, produced in our factory and installed by our own team."
        image={services[0]?.mainImage}
      >
        <Link href="/get-quote" className="btn btn-lg btn-light">{settings.primaryCta}</Link>
        <WhatsAppButton number={settings.whatsappNumber} message={settings.whatsappDefaultMessage} label="Discuss Your Interior" size="lg" />
      </PageHero>
      <section className="section">
        <div className="container-x grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => <ServiceCard key={s.serviceId} service={s} whatsappNumber={settings.whatsappNumber} priority={i < 3} index={i} />)}
        </div>
      </section>
      <DesignServices />
      <ModularSolutions />
      <ProcessTimeline />
      <div className="pt-16 md:pt-24" />
      <CTABanner settings={settings} />
    </>
  );
}
