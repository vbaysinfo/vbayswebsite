import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, verifySession, type Session } from "@/lib/session";

type AdminUser = { username: string; password: string; role: "admin" | "staff" };

function users(): AdminUser[] {
  return (process.env.ADMIN_USERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [username, password, role] = entry.split(":");
      return { username: username?.trim(), password: password ?? "", role: role?.trim() === "staff" ? "staff" : "admin" } as AdminUser;
    })
    .filter((u) => u.username && u.password.length >= 8);
}

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export function checkCredentials(username: string, password: string): AdminUser | null {
  let found: AdminUser | null = null;
  // Compare against every user to keep timing uniform.
  for (const u of users()) {
    if (safeEqual(u.username, username) && safeEqual(u.password, password)) found = u;
  }
  return found;
}

export async function createSessionCookie(user: AdminUser) {
  const token = await signSession({ sub: user.username, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/** For admin pages: redirects to login when there is no valid session. */
export async function requireSession(role?: "admin"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (role === "admin" && session.role !== "admin") redirect("/admin?denied=1");
  return session;
}

/** For admin API routes: returns a session or a 401/403 Response. */
export async function authorizeApi(role?: "admin"): Promise<Session | Response> {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (role === "admin" && session.role !== "admin") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  return session;
}
