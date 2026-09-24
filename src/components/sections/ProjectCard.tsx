"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Calendar, ChevronLeft, ChevronRight, Images, MapPin, Ruler, X } from "lucide-react";
import type { Project } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { whatsappUrl, WA_MESSAGES } from "@/lib/whatsapp";

type Props = {
  project: Project;
  className?: string;
  variant?: "default" | "feature" | "arch";
  /** All photos for the popup (cover + project gallery + GALLERY tab rows). */
  images?: string[];
  whatsappNumber?: string;
};

/**
 * Project tile. Clicking opens a popup gallery of the project's images;
 * the tile remains a real link (SEO, no-JS, ctrl/cmd-click to open the page).
 */
export function ProjectCard({ project, className = "", variant = "default", images, whatsappNumber }: Props) {
  const [open, setOpen] = useState(false);
  const photos = [...new Set((images?.length ? images : [project.coverImage, ...project.galleryImages]).filter(Boolean))];
  const count = Math.max(photos.length, 1);

  function onClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setOpen(true);
    track("project_view", { label: project.projectId, service: project.serviceSlug });
  }

  return (
    <>
      <Link href={`/projects/${project.slug}`} onClick={onClick} className={cn("group block h-full", className)} aria-haspopup="dialog">
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
          <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur">
            <Images className="h-3.5 w-3.5" aria-hidden /> {count} {count === 1 ? "photo" : "photos"}
          </span>
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
      {open && <ProjectModal project={project} photos={photos} whatsappNumber={whatsappNumber} onClose={() => setOpen(false)} />}
    </>
  );
}

function ProjectModal({ project, photos, whatsappNumber, onClose }: { project: Project; photos: string[]; whatsappNumber?: string; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const n = Math.max(photos.length, 1);
  const go = useCallback((d: number) => setIndex((i) => (i + d + n) % n), [n]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [go, onClose]);

  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  const facts = [
    project.location && { icon: MapPin, v: project.location },
    project.area && { icon: Ruler, v: project.area },
    project.projectDate && { icon: Calendar, v: project.projectDate },
  ].filter(Boolean) as { icon: typeof MapPin; v: string }[];

  return (
    <div role="dialog" aria-modal="true" aria-label={`${project.projectName} photos`} className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-up [animation-duration:.35s]" onClick={onClose}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white md:px-8 md:py-5" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="text-[0.65rem] tracking-[0.3em] text-brass uppercase">{project.category}</p>
          <p className="truncate text-lg md:text-2xl">{project.projectName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm tabular-nums text-white/60">{index + 1} / {n}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-4 overflow-y-auto px-4 pb-6 md:px-8 md:pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:content-stretch lg:overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          <div
            className="relative h-[52vh] shrink-0 overflow-hidden rounded-2xl bg-white/5 lg:h-auto lg:min-h-0 lg:flex-1"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            {photos.length ? (
              <SmartImage key={photos[index]} src={photos[index]} alt={`${project.projectName} — photo ${index + 1}`} fill sizes="(min-width:1024px) 70vw, 100vw" className="object-contain animate-fade-up [animation-duration:.4s]" />
            ) : (
              <SmartImage alt={project.projectName} fill />
            )}
            {n > 1 && (
              <>
                <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"><ChevronLeft /></button>
                <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"><ChevronRight /></button>
              </>
            )}
          </div>
          {n > 1 && (
            <div ref={thumbs} className="flex shrink-0 gap-2 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition md:h-20 md:w-28", i === index ? "ring-brass" : "opacity-60 ring-transparent hover:opacity-100")}
                >
                  <SmartImage src={src} alt="" fill sizes="112px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl bg-paper p-6 text-ink lg:overflow-y-auto">
          <h2 className="text-3xl leading-tight">{project.projectName}</h2>
          {facts.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {facts.map((f) => <li key={f.v} className="flex items-center gap-2"><f.icon className="h-4 w-4 text-brass" aria-hidden />{f.v}</li>)}
            </ul>
          )}
          {project.description && <p className="mt-5 leading-relaxed text-ink-soft">{project.description}</p>}
          <div className="mt-7 grid gap-2">
            {whatsappNumber && (
              <a
                href={whatsappUrl(whatsappNumber, WA_MESSAGES.similar(project.projectName))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { label: "project_popup", service: project.serviceSlug })}
                className="btn btn-wa"
              >
                <WhatsAppIcon /> Enquire Similar Design
              </a>
            )}
            <Link href={`/projects/${project.slug}`} className="btn btn-outline">View full project</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
