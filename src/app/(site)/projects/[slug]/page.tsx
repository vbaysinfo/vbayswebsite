import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Ruler, Wallet } from "lucide-react";
import { getContent } from "@/lib/server/content";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { WA_MESSAGES } from "@/lib/whatsapp";
import { PageHero } from "@/components/sections/PageHero";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { projectImages } from "@/lib/project-images";
import { CTABanner } from "@/components/sections/CTABanner";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { ViewEvent } from "@/components/layout/Trackers";
import { JsonLd } from "@/components/ui/JsonLd";

export async function generateStaticParams() {
  const { projects } = await getContent();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getContent();
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return pageMeta({ title: `${p.projectName}${p.location ? ` — ${p.location}` : ""}`, description: p.description, path: `/projects/${p.slug}`, image: p.coverImage });
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const { projects, gallery, settings, services } = await getContent();
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  const images = [
    ...p.galleryImages.map((src, i) => ({ id: `p-${i}`, src, title: p.projectName, category: p.category })),
    ...gallery.filter((g) => g.projectId === p.projectId && !p.galleryImages.includes(g.imageUrl)).map((g) => ({ id: g.imageId, src: g.imageUrl, title: g.title || p.projectName, category: g.category })),
  ];
  const service = services.find((s) => s.slug === p.serviceSlug);
  const more = projects.filter((x) => x.slug !== p.slug && x.category === p.category).concat(projects.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 3);
  const facts = [
    p.location && { icon: MapPin, label: "Location", value: p.location },
    p.projectDate && { icon: Calendar, label: "Completed", value: p.projectDate },
    p.area && { icon: Ruler, label: "Area", value: p.area },
    p.budgetRange && { icon: Wallet, label: "Budget", value: p.budgetRange },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  return (
    <>
      <ViewEvent event="project_view" label={p.projectId} service={p.serviceSlug} />
      <PageHero eyebrow={p.category} title={p.projectName} text={p.description} image={p.coverImage}>
        <WhatsAppButton number={settings.whatsappNumber} message={WA_MESSAGES.similar(p.projectName)} label="Enquire Similar Design" service={p.serviceSlug} size="lg" />
        <Link href="/get-quote" className="btn btn-lg btn-ghost-light">Get Free Consultation</Link>
      </PageHero>
      {facts.length > 0 && (
        <div className="border-b border-line bg-white">
          <dl className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-3"><f.icon className="mt-1 h-5 w-5 text-brass" aria-hidden /><div><dt className="text-xs font-bold tracking-widest text-muted uppercase">{f.label}</dt><dd className="mt-1 font-semibold">{f.value}</dd></div></div>
            ))}
          </dl>
        </div>
      )}
      <section className="section">
        <div className="container-x">
          {images.length > 0 ? <GalleryGrid items={images} categories={["All"]} whatsappNumber={settings.whatsappNumber} /> : <p className="text-muted">Photos coming soon.</p>}
          {service && <p className="mt-10 text-muted">Service: <Link href={`/interiors/${service.slug}`} className="font-semibold text-ink underline-offset-4 hover:underline">{service.serviceName}</Link></p>}
        </div>
      </section>
      {more.length > 0 && (
        <section className="section bg-stone">
          <div className="container-x">
            <SectionHeading eyebrow="More projects" title="You may also like" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{more.map((m) => <ProjectCard key={m.projectId} project={m} images={projectImages(m, gallery)} whatsappNumber={settings.whatsappNumber} />)}</div>
          </div>
        </section>
      )}
      <div className="pt-16 md:pt-24" />
      <CTABanner settings={settings} title="Want a similar design for your space?" message={WA_MESSAGES.similar(p.projectName)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: p.projectName, description: p.description, image: p.coverImage || undefined, locationCreated: p.location || undefined, creator: { "@id": `${SITE_URL}/#business` } }} />
    </>
  );
}
