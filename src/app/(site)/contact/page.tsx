import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { MapCard } from "@/components/sections/MapCard";
import { ContactForm } from "@/components/forms/ContactForm";
import { CallButton, WhatsAppButton } from "@/components/cta/TrackedLinks";
import { GoogleReviewsCTA } from "@/components/sections/GoogleReviewsCTA";
import { WA_MESSAGES } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({ title: "Contact Us", description: `Call, WhatsApp or visit ${s.companyName} in ${s.defaultCity}. Office and factory addresses, working hours and directions.`, path: "/contact" });
}

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's talk about your space" text="Call, WhatsApp, or send us a message — our design team usually responds within working hours.">
        <CallButton phone={s.phone} size="lg" className="!border-white !text-white hover:!bg-white hover:!text-ink" />
        <WhatsAppButton number={s.whatsappNumber} message={s.whatsappDefaultMessage} label="WhatsApp" size="lg" />
      </PageHero>
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-6">
            <div>
              <p className="font-display text-3xl">{s.companyName}</p>
              <p className="mt-2 text-muted">{s.footerText}</p>
            </div>
            <ul className="space-y-4">
              <li><CallButton phone={s.phone} className="flex items-center gap-3 font-semibold hover:text-brass-dark"><span className="grid h-11 w-11 place-items-center rounded-full bg-stone"><Phone className="h-5 w-5 text-brass-dark" /></span>{s.phone}</CallButton></li>
              <li><WhatsAppButton number={s.whatsappNumber} message={s.whatsappDefaultMessage} variant="link" className="!text-ink"><span className="grid h-11 w-11 place-items-center rounded-full bg-stone"><MessageCircle className="h-5 w-5 text-wa" /></span>WhatsApp: +{s.whatsappNumber}</WhatsAppButton></li>
              <li><a href={`mailto:${s.email}`} className="flex items-center gap-3 font-semibold hover:text-brass-dark"><span className="grid h-11 w-11 place-items-center rounded-full bg-stone"><Mail className="h-5 w-5 text-brass-dark" /></span>{s.email}</a></li>
              <li className="flex items-center gap-3 font-semibold"><span className="grid h-11 w-11 place-items-center rounded-full bg-stone"><Clock className="h-5 w-5 text-brass-dark" /></span>{s.workingHours}</li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <WhatsAppButton number={s.whatsappNumber} message={WA_MESSAGES.floorPlan} label="Send Your Floor Plan" size="sm" />
              <WhatsAppButton number={s.whatsappNumber} message={WA_MESSAGES.factory} label="Visit Our Factory" size="sm" />
            </div>
          </div>
          <div className="card p-6 md:p-10">
            <h2 className="mb-6 text-2xl font-medium">Request a consultation</h2>
            <ContactForm whatsappNumber={s.whatsappNumber} phone={s.phone} defaultCity={s.defaultCity} />
          </div>
        </div>
      </section>
      <section className="pb-16 md:pb-24">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <MapCard kind="office" title="Design Studio / Office" address={s.officeAddress} mapsUrl={s.googleMapsUrl} />
          <MapCard kind="factory" title="Factory" address={s.factoryAddress} mapsUrl={s.factoryMapsUrl} />
        </div>
      </section>
      <GoogleReviewsCTA settings={s} />
    </>
  );
}
