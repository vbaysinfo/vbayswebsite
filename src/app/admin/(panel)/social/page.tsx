import { connection } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { getCalendar, listCampaigns, listSocialPosts } from "@/lib/server/backend";
import { getContent } from "@/lib/server/content";
import { SocialManager } from "@/components/admin/SocialManager";
import { istToday } from "@/lib/stats";

export const metadata = { title: "Social Media" };

export default async function SocialPage() {
  await connection();
  await requireSession("admin");
  const [posts, calendar, campaigns, content] = await Promise.all([
    listSocialPosts().catch(() => null),
    getCalendar().catch(() => []),
    listCampaigns().catch(() => []),
    getContent(),
  ]);
  if (!posts) return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Could not load social posts from Google Sheets.</p>;
  return (
    <SocialManager
      initialPosts={posts}
      initialCalendar={calendar}
      campaigns={campaigns.map((c) => ({ id: c.campaignId, name: c.campaignName }))}
      services={content.services.map((s) => ({ slug: s.slug, name: s.serviceName, image: s.mainImage }))}
      projects={content.projects.map((p) => ({ id: p.projectId, name: p.projectName, location: p.location, image: p.coverImage }))}
      settings={{ company: content.settings.companyName, city: content.settings.defaultCity, autoPublish: content.settings.autoPublish }}
      today={istToday()}
    />
  );
}
