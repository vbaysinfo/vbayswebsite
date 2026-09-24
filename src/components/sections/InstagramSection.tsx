import { Play } from "lucide-react";
import type { InstagramMedia, Settings } from "@/lib/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { TrackedLink } from "@/components/cta/TrackedLinks";
import { InstagramIcon } from "@/components/ui/Icons";

/**
 * Latest posts from the official Instagram Graph API (via Apps Script, token
 * stored server-side). When the API isn't connected, shows a clean follow CTA
 * instead of scraping or faking posts.
 */
export function InstagramSection({ settings, media, fallbackImages }: { settings: Settings; media: InstagramMedia[]; fallbackImages: string[] }) {
  if (!settings.instagramUrl) return null;
  const utmUrl = settings.instagramUrl;
  return (
    <section className="section">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={settings.instagramHandle ? `@${settings.instagramHandle}` : "Instagram"}
            title="Follow Our Latest Work on Instagram"
            text="Fresh projects, factory updates, reels and interior ideas — every week."
          />
          <TrackedLink href={utmUrl} event="instagram_click" label="section_cta" className="btn btn-primary shrink-0">
            <InstagramIcon /> Follow Us on Instagram
          </TrackedLink>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {media.length > 0
            ? media.slice(0, 8).map((m) => (
                <TrackedLink key={m.id} href={m.permalink} event="instagram_click" label="post" className="group relative aspect-square overflow-hidden rounded-2xl bg-sand">
                  <SmartImage src={m.mediaType === "VIDEO" ? m.thumbnailUrl : m.mediaUrl} alt={m.caption?.slice(0, 100) || "Instagram post"} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  {m.mediaType === "VIDEO" && <Play className="absolute right-3 top-3 h-5 w-5 fill-white text-white" aria-label="Reel" />}
                </TrackedLink>
              ))
            : fallbackImages.slice(0, 4).map((src, i) => (
                <TrackedLink key={i} href={utmUrl} event="instagram_click" label="placeholder_tile" className="group relative aspect-square overflow-hidden rounded-2xl bg-sand">
                  <SmartImage src={src} alt="Interior project" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100"><InstagramIcon className="h-8 w-8 text-white" /></span>
                </TrackedLink>
              ))}
        </div>
      </div>
    </section>
  );
}
