import { Factory, MapPin, Navigation } from "lucide-react";
import { directionsUrl, mapEmbedUrl } from "@/lib/maps";
import { TrackedLink } from "@/components/cta/TrackedLinks";

export function MapCard({ title, address, mapsUrl, kind }: { title: string; address: string; mapsUrl: string; kind: "office" | "factory" }) {
  const Icon = kind === "factory" ? Factory : MapPin;
  return (
    <div className="card overflow-hidden">
      <iframe
        title={`${title} map`}
        src={mapEmbedUrl(address)}
        className="h-64 w-full border-0 grayscale-[30%]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-1 h-5 w-5 shrink-0 text-brass" aria-hidden />
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted">{address}</p>
          </div>
        </div>
        <TrackedLink href={directionsUrl(mapsUrl, address)} event="google_maps_click" label={`${kind}_directions`} className="btn btn-sm btn-outline shrink-0">
          <Navigation className="h-4 w-4" /> Get Directions
        </TrackedLink>
      </div>
    </div>
  );
}
