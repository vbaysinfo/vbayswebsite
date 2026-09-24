import { handleLeadRequest } from "@/lib/server/lead-handler";

export async function POST(req: Request) {
  return handleLeadRequest(req, "contact");
}
