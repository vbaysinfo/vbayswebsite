import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { getSettings } from "@/lib/server/content";
import { SITE_URL } from "@/lib/seo";
import { BRAND } from "@/data/site";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

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
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
