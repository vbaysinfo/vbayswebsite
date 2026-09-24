import { authorizeApi } from "@/lib/server/auth";
import { deleteSocialPost, saveSocialPost } from "@/lib/server/backend";
import { socialPostSchema } from "@/lib/validation";
import { z } from "zod";

// Batch first: every single-post field is optional, so a batch would otherwise match it.
const body = z.union([z.object({ posts: z.array(socialPostSchema).min(1).max(14) }), socialPostSchema.strict()]);

// Create/update one post, or a batch of drafts (content calendar generation).
export async function POST(req: Request) {
  const session = await authorizeApi("admin");
  if (session instanceof Response) return session;
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid post" }, { status: 422 });
  const d = parsed.data;
  const posts = "posts" in d ? d.posts : [d];
  for (const p of posts) {
    if (p.status === "Scheduled" && (!p.scheduledDate || !p.scheduledTime)) {
      return Response.json({ ok: false, error: "Scheduled posts need a date and time." }, { status: 422 });
    }
  }
  try {
    const saved = [];
    for (const p of posts) saved.push(await saveSocialPost(p));
    return Response.json({ ok: true, posts: saved });
  } catch (err) {
    console.error("[admin] social save failed:", (err as Error).message);
    return Response.json({ ok: false, error: "Could not save post" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const session = await authorizeApi("admin");
  if (session instanceof Response) return session;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[\w-]{1,30}$/.test(id)) return Response.json({ ok: false }, { status: 400 });
  try {
    await deleteSocialPost(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Could not delete post" }, { status: 502 });
  }
}
