"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";

export function AttributionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    captureAttribution();
  }, [pathname]);
  return null;
}

/** Google Analytics 4 (loads only when NEXT_PUBLIC_GA_ID is set). */
export function GoogleAnalytics({ gaId }: { gaId?: string }) {
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}

/** Fires service_view / project_view once per mount. */
export function ViewEvent({ event, service, label }: { event: "service_view" | "project_view"; service?: string; label?: string }) {
  useEffect(() => {
    track(event, { service, label });
  }, [event, service, label]);
  return null;
}
