import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/cn";

/** Project tile. `feature` fills a large mosaic cell; `arch` uses an arched top. */
export function ProjectCard({ project, className = "", variant = "default" }: { project: Project; className?: string; variant?: "default" | "feature" | "arch" }) {
  return (
    <Link href={`/projects/${project.slug}`} className={cn("group block h-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-sand",
          variant === "arch" ? "arch aspect-[4/5]" : "rounded-[var(--radius-card)]",
          variant === "feature" ? "aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[36rem]" : variant === "default" ? "aspect-[4/5]" : "",
        )}
      >
        <SmartImage
          src={project.coverImage}
          alt={`${project.projectName} — ${project.category} interior in ${project.location}`}
          fill
          sizes={variant === "feature" ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute right-5 top-5 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
          <p className="text-[0.68rem] tracking-[0.3em] text-brass-soft uppercase">{project.category}{project.location ? ` · ${project.location}` : ""}</p>
          <h3 className={cn("mt-2 leading-tight", variant === "feature" ? "text-3xl md:text-5xl" : "text-2xl")}>{project.projectName}</h3>
          <span className="mt-3 block h-px w-0 bg-brass transition-all duration-700 group-hover:w-20" />
        </div>
      </div>
    </Link>
  );
}
