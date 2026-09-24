"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { WA_MESSAGES } from "@/lib/whatsapp";

type Item = { id: string; src: string; title: string; category: string; description?: string };

/** Filterable masonry-style gallery with an accessible lightbox. */
export function GalleryGrid({ items, categories, whatsappNumber }: { items: Item[]; categories: string[]; whatsappNumber: string }) {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const shown = useMemo(() => (filter === "All" ? items : items.filter((i) => i.category === filter)), [filter, items]);
  const available = categories.filter((c) => c === "All" || items.some((i) => i.category === c));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % shown.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + shown.length) % shown.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, shown.length]);

  const current = open !== null ? shown[open] : null;

  return (
    <div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:px-0" role="toolbar" aria-label="Filter gallery">
        {available.map((c) => (
          <button key={c} type="button" className="chip shrink-0" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {shown.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl bg-sand text-left"
          >
            <div className={i % 3 === 1 ? "relative aspect-[4/5]" : "relative aspect-[4/3]"}>
              <SmartImage src={item.src} alt={item.title || item.category} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-white/75">{item.category}</p>
            </div>
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="py-16 text-center text-muted">No images in this category yet.</p>}

      {current && (
        <div role="dialog" aria-modal="true" aria-label={current.title} className="fixed inset-0 z-[60] flex flex-col bg-black/95">
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-sm"><span className="font-semibold">{current.title}</span> <span className="text-white/60">· {current.category}</span></p>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><X /></button>
          </div>
          <div className="relative flex-1">
            <SmartImage src={current.src} alt={current.title} fill sizes="100vw" className="object-contain" />
            <button type="button" aria-label="Previous" onClick={() => setOpen((o) => (o! - 1 + shown.length) % shown.length)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft /></button>
            <button type="button" aria-label="Next" onClick={() => setOpen((o) => (o! + 1) % shown.length)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight /></button>
          </div>
          <div className="flex justify-center p-4 pb-8">
            <WhatsAppButton number={whatsappNumber} message={WA_MESSAGES.similar(current.title)} label="Get Similar Design" service={current.category} />
          </div>
        </div>
      )}
    </div>
  );
}
