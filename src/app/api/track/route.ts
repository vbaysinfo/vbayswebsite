import { logEvent } from "@/lib/server/backend";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { eventSchema } from "@/lib/validation";

// Records conversion clicks (WhatsApp, call, Instagram, maps…) in Google Sheets.
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`track:${ip}`, 60, 60 * 1000).ok) return new Response(null, { status: 429 });
  try {
    const text = await req.text();
    if (text.length > 4000) return new Response(null, { status: 413 });
    const parsed = eventSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return new Response(null, { status: 400 });
    const a = parsed.data.attribution;
    await logEvent({
      ...parsed.data,
      attribution: {
        source: a.source || "Direct",
        campaign: a.campaign || a.utmCampaign || "",
        utmSource: a.utmSource || "",
        utmMedium: a.utmMedium || "",
        utmCampaign: a.utmCampaign || "",
        utmContent: a.utmContent || "",
        landingPage: a.landingPage || "",
        referrer: a.referrer || "",
      },
    });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[track] failed:", (err as Error).message);
    // Tracking failures are silent for visitors.
    return new Response(null, { status: 202 });
  }
}
