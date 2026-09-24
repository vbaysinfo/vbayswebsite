import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Outfit } from "next/font/google";
import { getSettings } from "@/lib/server/content";
import { SITE_URL } from "@/lib/seo";
import { BRAND } from "@/data/site";
import "./globals.css";

// Modern luxury pairing: Outfit (clean geometric sans) + Bodoni Moda Italic accents.
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans-face", display: "swap" });
const accent = Bodoni_Moda({ subsets: ["latin"], style: ["italic"], weight: ["400", "500"], variable: "--font-accent-face", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.companyName} | Interior Design & Modular Interiors in ${s.defaultCity}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${s.companyName}` },
    description: `${BRAND.subheadline} Modular kitchens, wardrobes and full home interiors in ${s.defaultCity}, manufactured in our own factory.`,
    applicationName: s.companyName,
    alternates: { canonical: SITE_URL },
    openGraph: { siteName: s.companyName, type: "website", locale: "en_IN", images: s.heroImage ? [{ url: s.heroImage }] : undefined },
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
    formatDetection: { telephone: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#2d3033",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${accent.variable}`}>
      <body>{children}</body>
    </html>
  );
}
