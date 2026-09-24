import "server-only";
import { attributionSchema, leadSchema } from "@/lib/validation";
import { BackendError } from "./apps-script";
import { createLead } from "./backend";
import { clientIp, rateLimit } from "./rate-limit";
import { verifyCaptcha } from "./turnstile";
import { readUploads, UploadError } from "./uploads";

const FRIENDLY = "We couldn't submit your enquiry right now. Please try WhatsApp or call us directly.";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Shared handler for POST /api/lead and /api/contact. */
export async function handleLeadRequest(req: Request, formType: "lead" | "contact") {
  const ip = clientIp(req);
  const limit = rateLimit(`lead:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return json({ ok: false, error: "Too many submissions. Please try again later or WhatsApp us." }, 429);

  const len = Number(req.headers.get("content-length") || 0);
  if (len > 12 * 1024 * 1024) return json({ ok: false, error: "Files are too large (max 5 MB each)." }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: FRIENDLY }, 400);
  }
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : "";
  };

  // Anti-spam: honeypot + minimum human completion time + optional CAPTCHA.
  const elapsed = Number(get("elapsedMs"));
  if (get("company_website") || (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 2500)) {
    // Pretend success so bots get no signal; nothing is stored.
    return json({ ok: true, leadId: "VB-RECEIVED" });
  }
  if (!(await verifyCaptcha(get("captchaToken") || null, ip))) {
    return json({ ok: false, error: "Please complete the verification and try again." }, 400);
  }

  const parsed = leadSchema.safeParse({
    name: get("name"),
    phone: get("phone"),
    whatsapp: get("whatsapp"),
    email: get("email"),
    city: get("city"),
    propertyType: get("propertyType"),
    requirement: get("requirement"),
    budget: get("budget"),
    propertyStatus: get("propertyStatus"),
    preferredContact: get("preferredContact"),
    message: get("message"),
    submissionId: get("submissionId"),
    formType,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return json({ ok: false, error: "Please check the highlighted fields.", fieldErrors }, 422);
  }

  let attribution;
  try {
    attribution = attributionSchema.parse(JSON.parse(get("attribution") || "{}"));
  } catch {
    attribution = attributionSchema.parse({});
  }

  let uploads;
  try {
    uploads = formType === "lead" ? await readUploads(form) : [];
  } catch (err) {
    if (err instanceof UploadError) return json({ ok: false, error: err.message }, 400);
    throw err;
  }

  try {
    const result = await createLead(
      {
        ...parsed.data,
        whatsapp: parsed.data.whatsapp || parsed.data.phone,
        attribution: {
          source: attribution.source || "Website",
          campaign: attribution.campaign || attribution.utmCampaign || "",
          utmSource: attribution.utmSource || "",
          utmMedium: attribution.utmMedium || "",
          utmCampaign: attribution.utmCampaign || "",
          utmContent: attribution.utmContent || "",
          landingPage: attribution.landingPage || "",
          referrer: attribution.referrer || "",
        },
      },
      uploads,
    );
    return json({ ok: true, leadId: result.leadId, duplicate: result.duplicate });
  } catch (err) {
    // Never leak internal details to customers.
    console.error("[lead] submission failed:", err instanceof BackendError ? `${err.code}: ${err.message}` : err);
    return json({ ok: false, error: FRIENDLY }, 503);
  }
}
