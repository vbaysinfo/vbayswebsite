import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { WA_MESSAGES } from "@/lib/whatsapp";

export function ServiceCard({ service, whatsappNumber, priority = false }: { service: Service; whatsappNumber: string; priority?: boolean }) {
  return (
    <article className="group card flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lift">
      <Link href={`/interiors/${service.slug}`} className="relative block aspect-[4/3] overflow-hidden" tabIndex={-1} aria-hidden>
        <SmartImage
          src={service.mainImage}
          alt={service.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-medium">
            <Link href={`/interiors/${service.slug}`} className="hover:text-brass-dark">{service.serviceName}</Link>
          </h3>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-brass transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </div>
        <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-muted">{service.shortDescription}</p>
        {service.startingPrice && <p className="mt-4 text-sm text-ink-soft">Starting from <strong className="text-ink">{service.startingPrice}</strong></p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link href={`/interiors/${service.slug}`} className="btn btn-sm btn-outline">View Details</Link>
          <WhatsAppButton
            number={whatsappNumber}
            message={service.whatsappMessage || WA_MESSAGES.service(service.serviceName)}
            label="WhatsApp Enquiry"
            service={service.slug}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
