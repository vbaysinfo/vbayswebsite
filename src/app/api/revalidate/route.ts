import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CMS_TAG } from "@/lib/server/content";
import { getSession } from "@/lib/server/auth";

// Refreshes website content after editing Google Sheets. Callable by:
//  • Apps Script (onEdit / menu) with the REVALIDATE_SECRET, or
//  • a logged-in admin from the dashboard.
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET || "";
  const given = req.headers.get("x-revalidate-secret") || "";
  const secretOk = secret.length >= 16 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!secretOk && !(await getSession())) return Response.json({ ok: false }, { status: 401 });
  revalidateTag(CMS_TAG, "max");
  return Response.json({ ok: true, revalidated: CMS_TAG });
}
