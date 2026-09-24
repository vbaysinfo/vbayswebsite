"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { LEAD_OPTIONS } from "@/data/site";
import { getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";
import { isEmail, normalizePhone } from "@/lib/phone";
import { telUrl, whatsappUrl, WA_MESSAGES } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Turnstile } from "./Turnstile";

export function ContactForm({ whatsappNumber, phone, defaultCity }: { whatsappNumber: string; phone: string; defaultCity: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState("");
  const [captcha, setCaptcha] = useState("");
  const startedAt = useRef(0);
  const submissionId = useRef("");
  const started = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    submissionId.current = crypto.randomUUID();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) || "").trim();
    const errs: Record<string, string> = {};
    if (v("name").length < 2) errs.name = "Please enter your name";
    if (!normalizePhone(v("phone"))) errs.phone = "Enter a valid mobile number";
    if (v("email") && !isEmail(v("email"))) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("submitting");
    fd.set("whatsapp", v("phone"));
    fd.set("formType", "contact");
    fd.set("submissionId", submissionId.current);
    fd.set("attribution", JSON.stringify(getAttribution()));
    fd.set("elapsedMs", String(Date.now() - startedAt.current));
    fd.set("captchaToken", captcha);
    try {
      const res = await fetch("/api/contact", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; leadId?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.ok || !json.leadId) {
        if (json.fieldErrors) setErrors(json.fieldErrors);
        setStatus("error");
        return;
      }
      setLeadId(json.leadId);
      setStatus("success");
      track("lead_form_submit", { service: v("requirement"), label: "contact_page" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-wa" />
        <h3 className="mt-4 text-2xl font-medium">Thank you — we&apos;ve received your message.</h3>
        <p className="mt-2 text-muted">Reference: <strong className="font-mono text-ink">{leadId}</strong></p>
        <a href={whatsappUrl(whatsappNumber, WA_MESSAGES.afterLead(leadId))} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { label: "after_contact" })} className="btn btn-wa mt-6">
          <WhatsAppIcon /> Continue on WhatsApp
        </a>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-red-700">{errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} onFocus={() => { if (!started.current) { started.current = true; track("lead_form_start", { label: "contact_page" }); } }} noValidate className="grid gap-4 sm:grid-cols-2">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div>
        <label className="label" htmlFor="cf-name">Name *</label>
        <input id="cf-name" name="name" className="field" autoComplete="name" required />
        {err("name")}
      </div>
      <div>
        <label className="label" htmlFor="cf-phone">Phone *</label>
        <input id="cf-phone" name="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" required />
        {err("phone")}
      </div>
      <div>
        <label className="label" htmlFor="cf-email">Email</label>
        <input id="cf-email" name="email" type="email" className="field" autoComplete="email" />
        {err("email")}
      </div>
      <div>
        <label className="label" htmlFor="cf-city">City</label>
        <input id="cf-city" name="city" className="field" defaultValue={defaultCity} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="cf-req">Requirement</label>
        <select id="cf-req" name="requirement" className="field" defaultValue="">
          <option value="" disabled>Select a requirement</option>
          {LEAD_OPTIONS.requirement.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="cf-msg">Message</label>
        <textarea id="cf-msg" name="message" rows={4} maxLength={2000} className="field" />
      </div>
      <div className="sm:col-span-2"><Turnstile onToken={setCaptcha} /></div>
      {status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:col-span-2">
          <p className="font-semibold">We couldn&apos;t submit your enquiry right now. Please try WhatsApp or call us directly.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={whatsappUrl(whatsappNumber, WA_MESSAGES.default)} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
            <a href={telUrl(phone)} className="btn btn-outline btn-sm"><Phone className="h-4 w-4" /> Call</a>
          </div>
        </div>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={status === "submitting"} className="btn btn-primary btn-lg w-full sm:w-auto">
          {status === "submitting" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Request Consultation"}
        </button>
      </div>
    </form>
  );
}
