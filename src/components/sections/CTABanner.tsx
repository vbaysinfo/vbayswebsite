import Link from "next/link";
import type { Settings } from "@/lib/types";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";

export function CTABanner({ settings, title, text, message, image }: {
  settings: Settings; title?: React.ReactNode; text?: string; message?: string; image?: string;
}) {
  return (
    <section className="section pt-0">
      <div className="container-x">
        <Reveal className="grain relative overflow-hidden rounded-[1.75rem] bg-espresso px-6 py-16 text-center text-white md:px-16 md:py-24">
          {image && <SmartImage src={image} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />}
          <div aria-hidden className="pointer-events-none absolute inset-4 rounded-[1.25rem] border border-brass/40 md:inset-6" />
          <p className="eyebrow justify-center text-brass">Design · Manufacture · Install</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] md:text-6xl">
            {title ?? <>Ready to design your <span className="gold-italic">space?</span></>}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-white/70">
            {text || "Share your requirement and floor plan — our designer will get back with ideas, a site-visit slot and next steps."}
          </p>
          <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/get-quote" className="btn btn-lg btn-light">{settings.primaryCta}</Link>
            <WhatsAppButton number={settings.whatsappNumber} message={message || settings.whatsappDefaultMessage} label={settings.secondaryCta} size="lg" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
