import { authorizeApi } from "@/lib/server/auth";
import { publishSocialPost } from "@/lib/server/backend";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/social/[id]/publish">) {
  const session = await authorizeApi("admin");
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  try {
    const post = await publishSocialPost(id);
    return Response.json({ ok: true, post });
  } catch (err) {
    console.error("[admin] publish failed:", (err as Error).message);
    return Response.json({ ok: false, error: "Publishing failed. See the post's error message." }, { status: 502 });
  }
}
