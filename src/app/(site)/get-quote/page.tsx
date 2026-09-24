import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getSettings } from "@/lib/server/content";
import { pageMeta } from "@/lib/seo";
import { LeadForm } from "@/components/forms/LeadForm";
import { CallButton, WhatsAppButton } from "@/components/cta/TrackedLinks";
import { WA_MESSAGES } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({ title: "Get a Free Interior Consultation", description: `Tell us about your space and get a free consultation from ${s.companyName}'s designers.`, path: "/get-quote" });
}

export default async function GetQuotePage() {
  const s = await getSettings();
  return (
    <section className="bg-stone pb-20 pt-28 md:pt-36">
      <div className="container-x grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="eyebrow">Free consultation</p>
          <h1 className="mt-5 text-4xl leading-tight font-medium md:text-5xl">Let&apos;s Design Your Dream Space</h1>
          <p className="mt-5 text-lg text-muted">Six quick steps. No obligation. A designer will call you back.</p>
          <ul className="mt-8 space-y-3 text-ink-soft">
            {["Free design consultation", "Site visit & measurements", "3D design before manufacturing", "Transparent, itemised quotation"].map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 text-brass" />{t}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton number={s.whatsappNumber} message={WA_MESSAGES.quote} label="Get Quote on WhatsApp" />
            <CallButton phone={s.phone} />
          </div>
        </div>
        <div className="card p-6 md:p-10">
          <LeadForm heading="" contact={{ whatsappNumber: s.whatsappNumber, phone: s.phone, defaultCity: s.defaultCity }} />
        </div>
      </div>
    </section>
  );
}
