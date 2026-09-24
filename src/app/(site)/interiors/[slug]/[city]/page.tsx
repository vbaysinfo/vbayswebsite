import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/server/content";
import { citySlug, pageMeta, withCity } from "@/lib/seo";
import { ServiceDetail } from "@/components/sections/ServiceDetail";

// Local-SEO landing pages: /interiors/{service}/{city} for every service area
// configured in the Settings sheet (no city is hard-coded).
export async function generateStaticParams() {
  const { services, settings } = await getContent();
  return services.flatMap((s) => settings.serviceAreas.map((c) => ({ slug: s.slug, city: citySlug(c) })));
}

async function resolve(slug: string, cityParam: string) {
  const content = await getContent();
  const service = content.services.find((s) => s.slug === slug);
  const city = content.settings.serviceAreas.find((c) => citySlug(c) === cityParam);
  return { ...content, service, city };
}

export async function generateMetadata({ params }: PageProps<"/interiors/[slug]/[city]">): Promise<Metadata> {
  const { slug, city: c } = await params;
  const { service: s, city } = await resolve(slug, c);
  if (!s || !city) return {};
  return pageMeta({
    title: withCity(s.seoTitle || `${s.serviceName} in {city}`, city),
    description: withCity(s.seoDescription || s.shortDescription, city),
    path: `/interiors/${s.slug}/${citySlug(city)}`,
    image: s.mainImage,
  });
}

export default async function ServiceCityPage({ params }: PageProps<"/interiors/[slug]/[city]">) {
  const { slug, city: c } = await params;
  const { service, city, settings, projects } = await resolve(slug, c);
  if (!service || !city) notFound();
  return <ServiceDetail service={service} settings={settings} projects={projects} city={city} path={`/interiors/${slug}/${c}`} />;
}
