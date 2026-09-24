import type { Metadata } from "next";
import { getContent, getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { BRAND } from "@/data/site";
import { PageHero } from "@/components/sections/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { DesignServices } from "@/components/sections/DesignServices";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTABanner } from "@/components/sections/CTABanner";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({ title: `About ${s.companyName}`, description: `${s.companyName} is an interior design studio with its own modular manufacturing factory in ${s.defaultCity}.`, path: "/about" });
}

export default async function AboutPage() {
  const { settings, testimonials } = await getContent();
  return (
    <>
      <PageHero eyebrow="About us" title={<>A design studio with its <em>own factory</em></>} text={BRAND.statement} image={settings.aboutImage} />
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Who we are" title="Design → Manufacturing → Installation" />
            <div className="prose-body mt-6 text-lg">
              <p>{settings.companyName} creates complete interiors for homes, offices and commercial spaces. Our designers plan every space in 2D and 3D, and our own modular factory manufactures the kitchens, wardrobes and furniture that bring those designs to life.</p>
              <p>Because design, production and installation are handled by one coordinated team, details don&apos;t get lost between vendors — what you approve in 3D is what we build and install.</p>
              <p>We serve {settings.serviceAreas.join(", ")}.</p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-sand">
            <SmartImage src={settings.factoryHeroImage} alt="Our manufacturing facility" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>
      <DesignServices />
      <WhyChooseUs />
      <ProcessTimeline />
      <Testimonials items={testimonials} />
      <div className="pt-16 md:pt-24" />
      <CTABanner settings={settings} />
    </>
  );
}
