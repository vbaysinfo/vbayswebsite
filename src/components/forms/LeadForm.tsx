"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, FileUp, Home, Hotel, Loader2, Paperclip, Phone, X,
} from "lucide-react";
import { LEAD_OPTIONS } from "@/data/site";
import { getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { isEmail, normalizePhone } from "@/lib/phone";
import { telUrl, whatsappUrl, WA_MESSAGES } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Turnstile } from "./Turnstile";

type Contact = { whatsappNumber: string; phone: string; defaultCity: string };

type Data = {
  requirement: string;
  propertyType: string;
  propertyStatus: string;
  budget: string;
  name: string;
  phone: string;
  whatsapp: string;
  sameWhatsapp: boolean;
  email: string;
  city: string;
  preferredContact: string;
  message: string;
};

const STEPS = ["Requirement", "Property", "Status", "Budget", "Contact", "Details"] as const;
const MAX_MB = 5;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

function OptionGrid({ options, value, onPick, icons }: { options: string[]; value: string; onPick: (v: string) => void; icons?: Record<string, React.ReactNode> }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            aria-pressed={active}
            className={cn(
              "group flex min-h-[3.75rem] items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-[0.92rem] font-semibold transition-all",
              active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:border-brass hover:text-ink",
            )}
          >
            {icons?.[o]}
            <span className="flex-1">{o}</span>
            <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", active ? "border-white bg-white text-ink" : "border-line")}>
              {active && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LeadForm({ contact, initialRequirement = "", heading = "Let's Design Your Dream Space", compact = false }: {
  contact: Contact;
  initialRequirement?: string;
  heading?: string;
  compact?: boolean;
}) {
  const formId = useId();
  const [step, setStep] = useState(initialRequirement ? 1 : 0);
  const [data, setData] = useState<Data>({
    requirement: initialRequirement,
    propertyType: "",
    propertyStatus: "",
    budget: "",
    name: "",
    phone: "",
    whatsapp: "",
    sameWhatsapp: true,
    email: "",
    city: contact.defaultCity,
    preferredContact: "WhatsApp",
    message: "",
  });
  const [files, setFiles] = useState<{ floorPlan?: File; referenceImage?: File }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [leadId, setLeadId] = useState("");
  const [captcha, setCaptcha] = useState("");
  const started = useRef(false);
  const startedAt = useRef(0);
  const submissionId = useRef("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = performance.now();
    submissionId.current = crypto.randomUUID();
  }, []);

  const markStarted = () => {
    if (!started.current) {
      started.current = true;
      track("lead_form_start", { service: data.requirement });
    }
  };

  const set = <K extends keyof Data>(k: K, v: Data[K]) => {
    markStarted();
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const go = (n: number) => {
    setStep(n);
    if (!compact) topRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const pick = (k: "requirement" | "propertyType" | "propertyStatus" | "budget", v: string) => {
    set(k, v);
    setTimeout(() => go(Math.min(step + 1, STEPS.length - 1)), 180);
  };

  const validateContact = () => {
    const e: Record<string, string> = {};
    if (data.name.trim().length < 2) e.name = "Please enter your name";
    if (!normalizePhone(data.phone)) e.phone = "Enter a valid 10-digit mobile number";
    if (!data.sameWhatsapp && data.whatsapp && !normalizePhone(data.whatsapp)) e.whatsapp = "Enter a valid WhatsApp number";
    if (data.email && !isEmail(data.email)) e.email = "Enter a valid email address";
    if (!data.city.trim()) e.city = "Please enter your city";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onFile = (field: "floorPlan" | "referenceImage", file?: File) => {
    markStarted();
    if (!file) return setFiles((f) => ({ ...f, [field]: undefined }));
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, [field]: `File must be ${MAX_MB} MB or smaller` }));
      return;
    }
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
      setErrors((e) => ({ ...e, [field]: "Only PDF, JPG, PNG or WEBP files" }));
      return;
    }
    setErrors((e) => ({ ...e, [field]: "" }));
    setFiles((f) => ({ ...f, [field]: file }));
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      if (step === 4 && !validateContact()) return;
      go(step + 1);
      return;
    }
    if (!validateContact()) {
      go(4);
      return;
    }
    setStatus("submitting");
    setServerMessage("");
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      requirement: data.requirement,
      propertyType: data.propertyType,
      propertyStatus: data.propertyStatus,
      budget: data.budget,
      name: data.name,
      phone: data.phone,
      whatsapp: data.sameWhatsapp ? data.phone : data.whatsapp,
      email: data.email,
      city: data.city,
      preferredContact: data.preferredContact,
      message: data.message,
      submissionId: submissionId.current,
      formType: "lead",
    };
    const body = new FormData();
    Object.entries(payload).forEach(([k, v]) => body.set(k, v));
    body.set("attribution", JSON.stringify(getAttribution()));
    body.set("company_website", String(fd.get("company_website") || "")); // honeypot
    body.set("elapsedMs", String(Math.round(e.timeStamp - startedAt.current)));
    body.set("captchaToken", captcha);
    if (files.floorPlan) body.set("floorPlan", files.floorPlan);
    if (files.referenceImage) body.set("referenceImage", files.referenceImage);

    try {
      const res = await fetch("/api/lead", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; leadId?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.ok || !json.leadId) {
        if (json.fieldErrors) {
          setErrors(json.fieldErrors);
          if (json.fieldErrors.name || json.fieldErrors.phone || json.fieldErrors.email) go(4);
        }
        setServerMessage(json.error || "");
        setStatus("error");
        return;
      }
      setLeadId(json.leadId);
      setStatus("success");
      track("lead_form_submit", { service: data.requirement, label: data.budget });
      track("consultation_request", { service: data.requirement });
      if (files.floorPlan) track("floor_plan_upload", { service: data.requirement });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div ref={topRef} className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-wa" aria-hidden />
        <h3 className="mt-5 text-2xl font-medium md:text-3xl">Thank you, {data.name.split(" ")[0]}!</h3>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Your enquiry has been received. Our design team will contact you shortly.
        </p>
        <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-stone px-5 py-2.5 text-sm">
          Your Lead ID: <strong className="font-mono tracking-wide text-ink">{leadId}</strong>
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappUrl(contact.whatsappNumber, WA_MESSAGES.afterLead(leadId))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { label: "after_lead", service: data.requirement })}
            className="btn btn-wa btn-lg"
          >
            <WhatsAppIcon /> Continue on WhatsApp
          </a>
          <a href={telUrl(contact.phone)} onClick={() => track("call_click", { label: "after_lead" })} className="btn btn-outline btn-lg">
            <Phone className="h-4 w-4" /> Call Us
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">WhatsApp opens with your Lead ID pre-filled so we can find your details instantly.</p>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div ref={topRef} className="scroll-mt-28">
      {heading && <h3 className="text-2xl font-medium md:text-3xl">{heading}</h3>}
      <div className={cn("flex items-center justify-between text-xs font-semibold text-muted", heading ? "mt-4" : "")}>
        <span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
        <span>Takes under a minute</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Form progress">
        <div className="h-full rounded-full bg-brass transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={submit} noValidate className="mt-6" aria-labelledby={formId}>
        <span id={formId} className="sr-only">Interior consultation enquiry</span>
        {/* Honeypot: hidden from people, bots fill it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
        </div>

        {step === 0 && (
          <fieldset>
            <legend className="mb-4 text-lg font-semibold">What are you looking for?</legend>
            <OptionGrid options={LEAD_OPTIONS.requirement} value={data.requirement} onPick={(v) => pick("requirement", v)} />
          </fieldset>
        )}
        {step === 1 && (
          <fieldset>
            <legend className="mb-4 text-lg font-semibold">What type of property is it?</legend>
            <OptionGrid
              options={LEAD_OPTIONS.propertyType}
              value={data.propertyType}
              onPick={(v) => pick("propertyType", v)}
              icons={{ Apartment: <Hotel className="h-5 w-5 shrink-0" />, Villa: <Home className="h-5 w-5 shrink-0" />, "Independent House": <Home className="h-5 w-5 shrink-0" />, Office: <Building2 className="h-5 w-5 shrink-0" />, Commercial: <Building2 className="h-5 w-5 shrink-0" /> }}
            />
          </fieldset>
        )}
        {step === 2 && (
          <fieldset>
            <legend className="mb-4 text-lg font-semibold">What stage is your property at?</legend>
            <OptionGrid options={LEAD_OPTIONS.propertyStatus} value={data.propertyStatus} onPick={(v) => pick("propertyStatus", v)} />
          </fieldset>
        )}
        {step === 3 && (
          <fieldset>
            <legend className="mb-4 text-lg font-semibold">What is your approximate budget?</legend>
            <OptionGrid options={LEAD_OPTIONS.budget} value={data.budget} onPick={(v) => pick("budget", v)} />
          </fieldset>
        )}
        {step === 4 && (
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-4 text-lg font-semibold">How can we reach you?</legend>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="lf-name">Full Name *</label>
              <input id="lf-name" className="field" autoComplete="name" value={data.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <p className="mt-1 text-sm text-red-700">{errors.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="lf-phone">Mobile Number *</label>
              <input id="lf-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="98xxxxxxxx" value={data.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} />
              {errors.phone && <p className="mt-1 text-sm text-red-700">{errors.phone}</p>}
            </div>
            <div>
              <label className="label" htmlFor="lf-email">Email</label>
              <input id="lf-email" className="field" type="email" inputMode="email" autoComplete="email" value={data.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-sm text-red-700">{errors.email}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
                <input type="checkbox" className="h-4 w-4 accent-[var(--color-brass)]" checked={data.sameWhatsapp} onChange={(e) => set("sameWhatsapp", e.target.checked)} />
                My WhatsApp number is the same as my mobile number
              </label>
            </div>
            {!data.sameWhatsapp && (
              <div>
                <label className="label" htmlFor="lf-wa">WhatsApp Number</label>
                <input id="lf-wa" className="field" type="tel" inputMode="tel" value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} aria-invalid={!!errors.whatsapp} />
                {errors.whatsapp && <p className="mt-1 text-sm text-red-700">{errors.whatsapp}</p>}
              </div>
            )}
            <div>
              <label className="label" htmlFor="lf-city">City *</label>
              <input id="lf-city" className="field" autoComplete="address-level2" value={data.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city} />
              {errors.city && <p className="mt-1 text-sm text-red-700">{errors.city}</p>}
            </div>
            <div className="sm:col-span-2">
              <span className="label">Preferred contact</span>
              <div className="flex flex-wrap gap-2">
                {LEAD_OPTIONS.preferredContact.map((c) => (
                  <button key={c} type="button" className="chip" aria-pressed={data.preferredContact === c} onClick={() => set("preferredContact", c)}>{c}</button>
                ))}
              </div>
            </div>
          </fieldset>
        )}
        {step === 5 && (
          <fieldset className="grid gap-4">
            <legend className="mb-4 text-lg font-semibold">Tell us more (optional)</legend>
            <div>
              <label className="label" htmlFor="lf-msg">Your requirements</label>
              <textarea id="lf-msg" rows={4} className="field" placeholder="E.g. 3BHK, need kitchen + 3 wardrobes, possession in March…" value={data.message} onChange={(e) => set("message", e.target.value)} maxLength={2000} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {([["floorPlan", "Upload Floor Plan"], ["referenceImage", "Upload Reference Image"]] as const).map(([field, label]) => (
                <div key={field}>
                  <label className={cn("flex min-h-[4.25rem] cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 transition-colors hover:border-brass", files[field] ? "border-brass bg-brass-soft/50" : "border-line bg-white")}>
                    {files[field] ? <Paperclip className="h-5 w-5 shrink-0 text-brass-dark" /> : <FileUp className="h-5 w-5 shrink-0 text-muted" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block truncate text-xs text-muted">{files[field]?.name || "PDF, JPG, PNG, WEBP · max 5 MB"}</span>
                    </span>
                    <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => onFile(field, e.target.files?.[0])} />
                    {files[field] && (
                      <button type="button" aria-label={`Remove ${label}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white" onClick={(e) => { e.preventDefault(); onFile(field); }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                  {errors[field] && <p className="mt-1 text-sm text-red-700">{errors[field]}</p>}
                </div>
              ))}
            </div>
            <Turnstile onToken={setCaptcha} />
            <p className="text-xs text-muted">
              Your files are stored privately and used only to prepare your design consultation.
            </p>
          </fieldset>
        )}

        {status === "error" && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">{serverMessage || "We couldn't submit your enquiry right now. Please try WhatsApp or call us directly."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={whatsappUrl(contact.whatsappNumber, `${WA_MESSAGES.service(data.requirement || "interior design")} My name is ${data.name}.`)} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { label: "form_error" })} className="btn btn-wa btn-sm">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp Us
              </a>
              <a href={telUrl(contact.phone)} onClick={() => track("call_click", { label: "form_error" })} className="btn btn-outline btn-sm"><Phone className="h-4 w-4" /> Call {contact.phone}</a>
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="btn btn-sm px-2 text-ink-soft hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : <span />}
          {step >= 4 ? (
            <button type="submit" disabled={status === "submitting"} className="btn btn-primary btn-lg min-w-[12rem] disabled:opacity-70">
              {status === "submitting" ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : step === 4 ? <>Continue <ArrowRight className="h-4 w-4" /></> : "Get Free Consultation"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!data[(["requirement", "propertyType", "propertyStatus", "budget"] as const)[step]]}
              onClick={() => go(step + 1)}
              className="btn btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
