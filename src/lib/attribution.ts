"use client";

import type { Attribution } from "./types";

// Captures first-touch + last-touch marketing attribution in the browser.
// Stored locally only; sent with lead forms and tracked events.

const KEY_FIRST = "vb_attr_first";
const KEY_LAST = "vb_attr_last";

function detectSource(utmSource: string, referrer: string): string {
  const s = `${utmSource} ${referrer}`.toLowerCase();
  if (/instagram|ig\b/.test(s)) return "Instagram";
  if (/facebook|fb\b|fb\.com/.test(s)) return "Facebook";
  if (/youtube|youtu\.be|yt\b/.test(s)) return "YouTube";
  if (/whatsapp|wa\.me/.test(s)) return "WhatsApp";
  if (/google|gmb|gbp/.test(s)) return "Google";
  if (/referral|ref/.test(s)) return "Referral";
  if (utmSource) return "Other";
  if (referrer && !referrer.includes(location.hostname)) return "Referral";
  return "Direct";
}

function safeGet(k: string): Attribution | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as Attribution) : null;
  } catch {
    return null;
  }
}
function safeSet(k: string, v: Attribution) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable (private mode) — attribution is best-effort */
  }
}

/** Call once per page load. New UTM params or an external referrer update last-touch. */
export function captureAttribution() {
  const p = new URLSearchParams(location.search);
  const utm = {
    utmSource: p.get("utm_source") || "",
    utmMedium: p.get("utm_medium") || "",
    utmCampaign: p.get("utm_campaign") || "",
    utmContent: p.get("utm_content") || "",
  };
  const referrer = document.referrer && !document.referrer.includes(location.hostname) ? document.referrer : "";
  const hasSignal = utm.utmSource || utm.utmCampaign || referrer || p.get("gclid") || p.get("fbclid");
  const current: Attribution = {
    ...utm,
    source: p.get("gclid") ? "Google" : p.get("fbclid") ? "Facebook" : detectSource(utm.utmSource, referrer),
    campaign: utm.utmCampaign,
    landingPage: location.pathname,
    referrer: referrer.slice(0, 300),
  };
  if (!safeGet(KEY_FIRST)) safeSet(KEY_FIRST, current);
  if (hasSignal || !safeGet(KEY_LAST)) safeSet(KEY_LAST, current);
}

export function getAttribution(): Attribution {
  const empty: Attribution = { source: "Direct", campaign: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", landingPage: "", referrer: "" };
  if (typeof window === "undefined") return empty;
  return safeGet(KEY_LAST) || safeGet(KEY_FIRST) || empty;
}
