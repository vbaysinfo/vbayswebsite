import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/server/content";
import { pageMeta, withCity } from "@/lib/seo";
import { ServiceDetail } from "@/components/sections/ServiceDetail";

export async function generateStaticParams() {
  const { services } = await getContent();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/interiors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { services, settings } = await getContent();
  const s = services.find((x) => x.slug === slug);
  if (!s) return {};
  const city = settings.defaultCity;
  return pageMeta({
    title: withCity(s.seoTitle || `${s.serviceName} in {city}`, city),
    description: withCity(s.seoDescription || s.shortDescription, city),
    path: `/interiors/${s.slug}`,
    image: s.mainImage,
  });
}

export default async function ServicePage({ params }: PageProps<"/interiors/[slug]">) {
  const { slug } = await params;
  const { services, settings, projects } = await getContent();
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  return <ServiceDetail service={service} settings={settings} projects={projects} city={settings.defaultCity} path={`/interiors/${slug}`} />;
}
