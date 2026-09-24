import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCTABar } from "@/components/layout/MobileCTABar";
import { AttributionTracker, GoogleAnalytics } from "@/components/layout/Trackers";
import { JsonLd } from "@/components/ui/JsonLd";
import { getContent } from "@/lib/server/content";
import { SITE_URL } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings: s } = await getContent();
  const sameAs = [s.instagramUrl, s.facebookUrl, s.youtubeUrl, s.googleBusinessProfileUrl].filter((u) => u && u !== "https://www.instagram.com/");
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileCTABar phone={s.phone} whatsappNumber={s.whatsappNumber} message={s.whatsappDefaultMessage} />
      <AttributionTracker />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HomeAndConstructionBusiness",
          "@id": `${SITE_URL}/#business`,
          name: s.companyName,
          url: SITE_URL,
          logo: s.logoUrl || undefined,
          image: s.heroImage || undefined,
          telephone: s.phone,
          email: s.email,
          address: { "@type": "PostalAddress", streetAddress: s.officeAddress, addressLocality: s.defaultCity, addressCountry: "IN" },
          areaServed: s.serviceAreas.map((c) => ({ "@type": "City", name: c })),
          openingHours: s.workingHours,
          sameAs: sameAs.length ? sameAs : undefined,
          department: [{ "@type": "LocalBusiness", name: `${s.companyName} — Modular Factory`, address: s.factoryAddress }],
        }}
      />
    </>
  );
}
