import type { Metadata } from "next";
import { getContent, getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { GALLERY_CATEGORIES } from "@/data/site";
import { WA_MESSAGES } from "@/lib/whatsapp";
import { PageHero } from "@/components/sections/PageHero";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CTABanner } from "@/components/sections/CTABanner";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({ title: "Interior Design Gallery", description: `Kitchen, bedroom, wardrobe, living room, office and factory photos from ${s.companyName}.`, path: "/gallery" });
}

export default async function GalleryPage() {
  const { settings, gallery, projects, beforeAfter } = await getContent();
  // Gallery sheet images + project gallery images, de-duplicated.
  const seen = new Set<string>();
  const items = [
    ...gallery.map((g) => ({ id: g.imageId, src: g.imageUrl, title: g.title, category: g.category, description: g.description })),
    ...projects.flatMap((p) => [p.coverImage, ...p.galleryImages].filter(Boolean).map((src, i) => ({ id: `${p.projectId}-${i}`, src, title: p.projectName, category: p.category }))),
  ].filter((i) => (seen.has(i.src) ? false : (seen.add(i.src), true)));

  return (
    <>
      <PageHero eyebrow="Gallery" title={<>Interiors &amp; manufacturing, <em>in pictures</em></>} text="Browse by room — tap any image to view it larger or ask for a similar design on WhatsApp." image={items[0]?.src} />
      <section className="section">
        <div className="container-x">
          <GalleryGrid items={items} categories={GALLERY_CATEGORIES} whatsappNumber={settings.whatsappNumber} />
        </div>
      </section>
      {beforeAfter.length > 0 && (
        <section className="section bg-stone">
          <div className="container-x">
            <SectionHeading eyebrow="Before & after" title="Transformations" text="Drag the handle to compare." />
            <div className="mt-12 grid gap-14">
              {beforeAfter.map((b) => (
                <div key={b.id} className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
                  <BeforeAfterSlider before={b.beforeImage} after={b.afterImage} alt={b.projectName} />
                  <div>
                    <h3 className="text-2xl font-medium">{b.projectName}</h3>
                    <p className="mt-1 text-sm text-muted">{[b.category, b.location].filter(Boolean).join(" · ")}</p>
                    <p className="mt-4 leading-relaxed text-ink-soft">{b.description}</p>
                    <p className="mt-6 font-semibold">Want a Similar Transformation?</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link href="/get-quote" className="btn btn-primary btn-sm">Get Free Consultation</Link>
                      <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.similar(b.projectName)} label="WhatsApp" size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="pt-16 md:pt-24" />
      <CTABanner settings={settings} />
    </>
  );
}
