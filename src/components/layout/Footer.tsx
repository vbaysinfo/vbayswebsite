import Link from "next/link";
import { Clock, Factory, Mail, MapPin, Phone } from "lucide-react";
import { getContent, getCurrentYear } from "@/lib/server/content";
import { NAV_INTERIORS } from "@/data/site";
import { citySlug } from "@/lib/seo";
import { CallButton, TrackedLink, WhatsAppButton } from "@/components/cta/TrackedLinks";
import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/ui/Icons";
import { directionsUrl } from "@/lib/maps";

export async function Footer() {
  const { settings, services } = await getContent();
  const year = await getCurrentYear();
  return (
    <footer className="bg-ink pb-28 text-white/75 md:pb-0">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <p className="font-display text-2xl text-white">{settings.companyName}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{settings.footerText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppButton number={settings.whatsappNumber} message={settings.whatsappDefaultMessage} size="sm" />
            <Link href="/get-quote" className="btn btn-sm btn-ghost-light">{settings.primaryCta}</Link>
          </div>
          <div className="mt-6 flex gap-2">
            {settings.instagramUrl && (
              <TrackedLink href={settings.instagramUrl} event="instagram_click" label="footer" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 hover:bg-white hover:text-ink">
                <InstagramIcon /><span className="sr-only">Instagram</span>
              </TrackedLink>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 hover:bg-white hover:text-ink">
                <FacebookIcon /><span className="sr-only">Facebook</span>
              </a>
            )}
            {settings.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 hover:bg-white hover:text-ink">
                <YouTubeIcon /><span className="sr-only">YouTube</span>
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.18em] text-white uppercase">Interiors</p>
          <ul className="space-y-2.5 text-sm">
            {NAV_INTERIORS.slice(1).map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.18em] text-white uppercase">Company</p>
          <ul className="space-y-2.5 text-sm">
            {[["Projects", "/projects"], ["Gallery", "/gallery"], ["Our Factory", "/factory"], ["About", "/about"], ["Contact", "/contact"], ["Get a Quote", "/get-quote"]].map(([l, h]) => (
              <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 text-sm">
          <p className="mb-4 text-xs font-bold tracking-[0.18em] text-white uppercase">Visit & Contact</p>
          <p className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><span><span className="font-semibold text-white">Studio: </span>{settings.officeAddress}</span></p>
          <p className="flex gap-3"><Factory className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><span><span className="font-semibold text-white">Factory: </span>{settings.factoryAddress}</span></p>
          <CallButton phone={settings.phone} className="flex gap-3 hover:text-white"><Phone className="h-4 w-4 text-brass" />{settings.phone}</CallButton>
          <a href={`mailto:${settings.email}`} className="flex gap-3 hover:text-white"><Mail className="h-4 w-4 text-brass" />{settings.email}</a>
          <p className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-brass" />{settings.workingHours}</p>
          <TrackedLink href={directionsUrl(settings.factoryMapsUrl, settings.factoryAddress)} event="google_maps_click" label="footer_factory" className="inline-block font-semibold text-brass-soft underline-offset-4 hover:underline">
            Get directions to our factory →
          </TrackedLink>
        </div>
      </div>

      {settings.serviceAreas.length > 0 && (
        <div className="border-t border-white/10">
          <div className="container-x py-6 text-xs leading-relaxed">
            <span className="font-semibold text-white">Service areas: </span>
            {settings.serviceAreas.map((city, i) => (
              <span key={city}>
                {i > 0 && " · "}
                {services.find((s) => s.slug === "modular-kitchen") ? (
                  <Link href={`/interiors/modular-kitchen/${citySlug(city)}`} className="hover:text-white">Modular kitchen in {city}</Link>
                ) : city}
                {" · "}
                <Link href={`/interiors/full-home-interiors/${citySlug(city)}`} className="hover:text-white">Interior designers in {city}</Link>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs md:flex-row md:justify-between">
          <p>© {year} {settings.companyName}. All rights reserved.</p>
          <p>Design → Manufacturing → Installation</p>
        </div>
      </div>
    </footer>
  );
}
