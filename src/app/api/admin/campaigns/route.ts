import { authorizeApi } from "@/lib/server/auth";
import { saveCampaign } from "@/lib/server/backend";
import { campaignSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await authorizeApi("admin");
  if (session instanceof Response) return session;
  const parsed = campaignSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid campaign" }, { status: 422 });
  try {
    return Response.json({ ok: true, campaign: await saveCampaign(parsed.data) });
  } catch {
    return Response.json({ ok: false, error: "Could not save campaign" }, { status: 502 });
  }
}
