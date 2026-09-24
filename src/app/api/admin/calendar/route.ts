import { authorizeApi } from "@/lib/server/auth";
import { saveCalendar } from "@/lib/server/backend";
import { calendarSchema } from "@/lib/validation";

export async function PUT(req: Request) {
  const session = await authorizeApi("admin");
  if (session instanceof Response) return session;
  const parsed = calendarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid calendar" }, { status: 422 });
  try {
    return Response.json({ ok: true, calendar: await saveCalendar(parsed.data) });
  } catch {
    return Response.json({ ok: false, error: "Could not save calendar" }, { status: 502 });
  }
}
