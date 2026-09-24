"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

/** Cloudflare Turnstile anti-bot widget. Renders nothing when no site key is configured. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.turnstile && ref.current && !idRef.current) {
        idRef.current = window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken, theme: "light" });
        clearInterval(timer);
      }
      if (tries > 50) clearInterval(timer);
    }, 200);
    return () => {
      clearInterval(timer);
      if (idRef.current) window.turnstile?.remove(idRef.current);
      idRef.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
