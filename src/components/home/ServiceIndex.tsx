"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

/**
 * Editorial numbered index of services. On desktop, hovering a row reveals
 * that service's image in the arched frame beside the list.
 */
export function ServiceIndex({ services }: { services: Service[] }) {
  const [active, setActive] = useState(0);
  const current = services[active] ?? services[0];
  return (
    <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
      <ol className="border-t border-line">
        {services.map((s, i) => (
          <li key={s.serviceId} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
            <Link
              href={`/interiors/${s.slug}`}
              className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-line py-6 transition-colors md:grid-cols-[4.5rem_1fr_auto] md:py-7"
            >
              <span className={`font-display text-lg transition-colors md:text-xl ${active === i ? "text-brass" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className={`block font-display text-[1.7rem] leading-tight transition-all duration-500 md:text-[2.4rem] ${active === i ? "translate-x-2 italic text-brass-dark" : "text-ink"}`}>
                  {s.serviceName}
                </span>
                <span className="mt-1 block max-w-md text-sm text-muted">{s.shortDescription}</span>
              </span>
              <span className={`grid h-11 w-11 place-items-center rounded-full border transition-all duration-500 ${active === i ? "border-ink bg-ink text-white" : "border-line text-ink"}`}>
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="relative hidden lg:block">
        <div className="sticky top-32">
          <div className="absolute -inset-3 translate-x-5 translate-y-5 rounded-[999px_999px_1.5rem_1.5rem] border border-brass/60" aria-hidden />
          <div className="arch relative aspect-[3/4] bg-sand">
            {services.map((s, i) => (
              <div key={s.serviceId} className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}>
                <SmartImage src={s.mainImage} alt={s.imageAlt} fill sizes="40vw" className="object-cover" />
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs tracking-[0.3em] text-muted uppercase">{current?.category}</p>
        </div>
      </div>
    </div>
  );
}
