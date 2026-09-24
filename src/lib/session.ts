// Session token helpers — shared by proxy.ts and server code (no Node-only APIs).
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "vb_admin";
export type Session = { sub: string; role: "admin" | "staff" };

function key() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
    return new TextEncoder().encode("dev-only-insecure-session-secret-change-me!!");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(s: Session) {
  return new SignJWT({ role: s.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: payload.role === "staff" ? "staff" : "admin" };
  } catch {
    return null;
  }
}
