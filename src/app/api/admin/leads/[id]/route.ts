import { authorizeApi } from "@/lib/server/auth";
import { updateLead } from "@/lib/server/backend";
import { leadUpdateSchema } from "@/lib/validation";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/leads/[id]">) {
  const session = await authorizeApi();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const parsed = leadUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid update" }, { status: 422 });
  try {
    const lead = await updateLead(decodeURIComponent(id), parsed.data, session.sub);
    return Response.json({ ok: true, lead });
  } catch (err) {
    console.error("[admin] lead update failed:", (err as Error).message);
    return Response.json({ ok: false, error: "Could not update lead" }, { status: 502 });
  }
}
