import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { WA_MESSAGES } from "@/lib/whatsapp";

export function ServiceCard({ service, whatsappNumber, priority = false, index }: { service: Service; whatsappNumber: string; priority?: boolean; index?: number }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/interiors/${service.slug}`} className="arch relative block aspect-[4/5] bg-sand" tabIndex={-1} aria-hidden>
        <SmartImage
          src={service.mainImage}
          alt={service.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>
      <div className="flex flex-1 flex-col pt-6">
        <div className="flex items-baseline gap-3">
          {index !== undefined && <span className="font-display text-lg text-brass">{String(index + 1).padStart(2, "0")}</span>}
          <h3 className="flex-1 text-3xl leading-tight">
            <Link href={`/interiors/${service.slug}`} className="transition-colors hover:text-brass-dark">{service.serviceName}</Link>
          </h3>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-brass transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </div>
        <p className="mt-3 flex-1 leading-relaxed text-muted">{service.shortDescription}</p>
        {service.startingPrice && <p className="mt-4 text-sm text-ink-soft">Starting from <strong className="font-medium text-ink">{service.startingPrice}</strong></p>}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <Link href={`/interiors/${service.slug}`} className="btn btn-sm btn-outline">View Details</Link>
          <WhatsAppButton number={whatsappNumber} message={service.whatsappMessage || WA_MESSAGES.service(service.serviceName)} label="WhatsApp Enquiry" service={service.slug} size="sm" />
        </div>
      </div>
    </article>
  );
}
