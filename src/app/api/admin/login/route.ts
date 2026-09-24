import { checkCredentials, createSessionCookie } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
  if (!rl.ok) return Response.json({ ok: false, error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} min.` }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username.slice(0, 60) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const user = checkCredentials(username, password);
  if (!user) {
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ ok: false, error: "Invalid username or password." }, { status: 401 });
  }
  await createSessionCookie(user);
  return Response.json({ ok: true });
}
