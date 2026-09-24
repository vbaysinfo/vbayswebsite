import Link from "next/link";
import type { Settings } from "@/lib/types";
import { WhatsAppButton } from "@/components/cta/TrackedLinks";

export function CTABanner({ settings, title = "Ready to design your space?", text, message }: {
  settings: Settings; title?: string; text?: string; message?: string;
}) {
  return (
    <section className="section pt-0">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-14 text-center text-white md:px-16 md:py-20">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />
          <p className="eyebrow justify-center text-brass-soft">Design · Manufacture · Install</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl leading-tight font-medium md:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/75">
            {text || "Share your requirement and floor plan — our designer will get back with ideas, a site-visit slot and next steps."}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/get-quote" className="btn btn-lg bg-white text-ink hover:bg-brass-soft">{settings.primaryCta}</Link>
            <WhatsAppButton number={settings.whatsappNumber} message={message || settings.whatsappDefaultMessage} label={settings.secondaryCta} size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
