import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Project } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

export function ProjectCard({ project, className = "" }: { project: Project; className?: string }) {
  return (
    <Link href={`/projects/${project.slug}`} className={`group relative block overflow-hidden rounded-[var(--radius-card)] bg-sand ${className}`}>
      <div className="relative aspect-[4/5] sm:aspect-[4/3]">
        <SmartImage
          src={project.coverImage}
          alt={`${project.projectName} — ${project.category} interior in ${project.location}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{project.category}</span>
          <h3 className="mt-3 text-xl font-medium leading-snug">{project.projectName}</h3>
          {project.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-3.5 w-3.5" />{project.location}</p>}
        </div>
      </div>
    </Link>
  );
}
