import { connection } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { listCampaigns } from "@/lib/server/backend";
import { CampaignManager } from "@/components/admin/CampaignManager";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  await connection();
  await requireSession("admin");
  const campaigns = await listCampaigns().catch(() => null);
  if (!campaigns) return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Could not load campaigns from Google Sheets.</p>;
  return <CampaignManager initial={campaigns} siteUrl={SITE_URL} />;
}
