import type { Metadata } from "next";
import { getContent, getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { GALLERY_CATEGORIES } from "@/data/site";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectsFilter } from "@/components/sections/ProjectsFilter";
import { CTABanner } from "@/components/sections/CTABanner";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({ title: `Interior Projects in ${s.defaultCity}`, description: `Completed kitchens, wardrobes, full homes, offices and commercial interiors by ${s.companyName} — designed, manufactured and installed by our team.`, path: "/projects" });
}

export default async function ProjectsPage() {
  const { settings, projects } = await getContent();
  return (
    <>
      <PageHero eyebrow="Projects" title={<>Completed <em>projects</em></>} text="Real homes and workplaces — designed in our studio, made in our factory and installed by our team." image={projects[0]?.coverImage} />
      <section className="section">
        <div className="container-x">
          <ProjectsFilter projects={projects} categories={GALLERY_CATEGORIES.filter((c) => c !== "Factory")} />
        </div>
      </section>
      <CTABanner settings={settings} title="Like what you see? Let's create yours." />
    </>
  );
}
