"use client";

import { getAttribution } from "./attribution";
import type { TrackedEvent } from "./types";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "page_view"
  | "service_view"
  | "project_view"
  | "lead_form_start"
  | "lead_form_submit"
  | "floor_plan_upload"
  | TrackedEvent;

// Conversion events that are also recorded in Google Sheets (EVENTS tab) so
// the admin dashboard and campaign metrics use first-party numbers.
const SERVER_LOGGED: TrackedEvent[] = [
  "whatsapp_click",
  "call_click",
  "instagram_click",
  "google_maps_click",
  "factory_visit_request",
  "quote_request",
  "consultation_request",
];

export function track(event: AnalyticsEvent, params: { service?: string; label?: string; [k: string]: unknown } = {}) {
  if (typeof window === "undefined") return;
  const a = getAttribution();
  const payload = {
    page_path: location.pathname,
    service: params.service || "",
    campaign: a.utmCampaign,
    utm_source: a.utmSource,
    utm_medium: a.utmMedium,
    utm_campaign: a.utmCampaign,
    utm_content: a.utmContent,
    lead_source: a.source,
    ...params,
  };
  window.gtag?.("event", event, payload);

  if ((SERVER_LOGGED as string[]).includes(event)) {
    const body = JSON.stringify({
      eventType: event,
      page: location.pathname,
      service: params.service || "",
      label: params.label || "",
      attribution: a,
    });
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/track", blob)) {
        void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch {
      /* tracking must never break navigation */
    }
  }
}
