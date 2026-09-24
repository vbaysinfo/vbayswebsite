"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

export function ProjectsFilter({ projects, categories, imagesById, whatsappNumber }: { projects: Project[]; categories: string[]; imagesById: Record<string, string[]>; whatsappNumber: string }) {
  const [filter, setFilter] = useState("All");
  const available = categories.filter((c) => c === "All" || projects.some((p) => p.category === c));
  const shown = useMemo(() => (filter === "All" ? projects : projects.filter((p) => p.category === filter)), [filter, projects]);
  return (
    <>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:px-0" role="toolbar" aria-label="Filter projects">
        {available.map((c) => <button key={c} type="button" className="chip shrink-0" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => <ProjectCard key={p.projectId} project={p} images={imagesById[p.projectId]} whatsappNumber={whatsappNumber} />)}
      </div>
      {shown.length === 0 && <p className="py-16 text-center text-muted">No projects in this category yet.</p>}
    </>
  );
}
