"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, ExternalLink, Loader2, PenLine, Send, Sparkles, Trash2, Wand2 } from "lucide-react";
import { CONTENT_TYPES, SOCIAL_PLATFORMS, type CalendarEntry, type SocialPost } from "@/lib/types";
import { CTAS, generateContent, TONES, TOPICS } from "@/lib/content-generator";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";

type Props = {
  initialPosts: SocialPost[];
  initialCalendar: CalendarEntry[];
  campaigns: { id: string; name: string }[];
  services: { slug: string; name: string; image: string }[];
  projects: { id: string; name: string; location: string; image: string }[];
  settings: { company: string; city: string; autoPublish: boolean };
  today: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
// Platforms whose official APIs support direct publishing in this system.
const AUTO_PUBLISH_SUPPORT: Record<string, string[]> = {
  Instagram: ["Image", "Carousel", "Reel", "Video", "Story"],
  Facebook: ["Image", "Carousel", "Video"],
};
const supportsAuto = (platform: string, type: string) => AUTO_PUBLISH_SUPPORT[platform]?.includes(type) ?? false;

const empty: Partial<SocialPost> = { contentType: "Image", platform: "Instagram", caption: "", imageUrl: "", videoUrl: "", hashtags: "", campaignId: "", scheduledDate: "", scheduledTime: "18:30", status: "Draft" };

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");
  return json as T;
}

export function SocialManager({ initialPosts, initialCalendar, campaigns, services, projects, settings, today }: Props) {
  const [tab, setTab] = useState<"posts" | "generator" | "calendar">("posts");
  const [posts, setPosts] = useState(initialPosts);
  const [editing, setEditing] = useState<Partial<SocialPost> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");

  const upsert = (p: SocialPost) => setPosts((ps) => (ps.some((x) => x.postId === p.postId) ? ps.map((x) => (x.postId === p.postId ? p : x)) : [p, ...ps]));

  async function save(p: Partial<SocialPost>) {
    setBusy("save");
    setMsg("");
    try {
      const { posts: saved } = await api<{ posts: SocialPost[] }>("/api/admin/social", { method: "POST", body: JSON.stringify(p) });
      saved.forEach(upsert);
      setEditing(null);
      setMsg("Saved to Google Sheets.");
      return saved;
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function publish(p: SocialPost) {
    if (!confirm(`Publish this post to ${p.platform} now?`)) return;
    setBusy(p.postId);
    try {
      const { post } = await api<{ post: SocialPost }>(`/api/admin/social/${encodeURIComponent(p.postId)}/publish`, { method: "POST" });
      upsert(post);
      setMsg(post.status === "Published" ? "Published ✓" : `Status: ${post.status}${post.errorMessage ? ` — ${post.errorMessage}` : ""}`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: SocialPost) {
    if (!confirm("Delete this post?")) return;
    setBusy(p.postId);
    try {
      await api(`/api/admin/social?id=${encodeURIComponent(p.postId)}`, { method: "DELETE" });
      setPosts((ps) => ps.filter((x) => x.postId !== p.postId));
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const shown = useMemo(
    () => posts.filter((p) => !filter || p.status === filter).sort((a, b) => `${b.scheduledDate}${b.createdAt}`.localeCompare(`${a.scheduledDate}${a.createdAt}`)),
    [posts, filter],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium">Social Media</h1>
          <p className="text-sm text-muted">
            Draft → Approve → Schedule → Publish. Auto-publish is <strong>{settings.autoPublish ? "ON" : "OFF"}</strong>
            {settings.autoPublish ? " (approved posts with a date/time publish automatically)" : " (only posts you set to Scheduled are published)"}.
          </p>
        </div>
        <button onClick={() => setEditing({ ...empty })} className="btn btn-primary btn-sm"><PenLine className="h-4 w-4" />New post</button>
      </div>

      <div className="mt-6 flex gap-1 rounded-full bg-white p-1 ring-1 ring-line sm:inline-flex">
        {([["posts", "Posts", Send], ["generator", "Content Generator", Wand2], ["calendar", "Content Calendar", CalendarDays]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", tab === k ? "bg-ink text-white" : "text-ink-soft")}>
            <I className="h-4 w-4" /><span className="hidden sm:inline">{l}</span>
          </button>
        ))}
      </div>
      {msg && <p role="status" className="mt-4 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-line">{msg}</p>}

      {tab === "posts" && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {["", "Draft", "Approved", "Scheduled", "Published", "Ready to Publish", "Failed"].map((s) => (
              <button key={s} className="chip !py-1.5 text-xs" aria-pressed={filter === s} onClick={() => setFilter(s)}>{s || "All"} ({s ? posts.filter((p) => p.status === s).length : posts.length})</button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => (
              <article key={p.postId} className="card flex flex-col overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl.split(/\n|\|/)[0]} alt="" className="aspect-[4/3] w-full bg-sand object-cover" loading="lazy" />
                ) : <div className="grid aspect-[4/3] place-items-center bg-sand text-sm text-muted">{p.videoUrl ? "Video" : "No media"}</div>}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={p.status} />
                    <span className="font-semibold">{p.platform}</span>·<span>{p.contentType}</span>
                    <span className="ml-auto font-mono text-muted">{p.postId}</span>
                  </div>
                  <p className="mt-3 line-clamp-4 flex-1 text-sm whitespace-pre-line text-ink-soft">{p.caption || <em className="text-muted">No caption</em>}</p>
                  <p className="mt-3 text-xs text-muted">{p.scheduledDate ? `📅 ${p.scheduledDate} ${p.scheduledTime}` : "Not scheduled"}</p>
                  {!supportsAuto(p.platform, p.contentType) && <p className="mt-1 text-xs font-semibold text-orange-700">Manual posting: {p.platform} {p.contentType} can&apos;t be auto-published via official API → &quot;Ready to Publish&quot;.</p>}
                  {p.errorMessage && <p className="mt-1 text-xs text-red-700">{p.errorMessage}</p>}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <button onClick={() => setEditing(p)} className="btn btn-outline btn-sm !min-h-8 !px-3 text-xs">Edit</button>
                    {p.status === "Draft" && <button disabled={!!busy} onClick={() => save({ postId: p.postId, status: "Approved" })} className="btn btn-sm !min-h-8 !px-3 bg-blue-700 text-xs text-white"><Check className="h-3.5 w-3.5" />Approve</button>}
                    {p.status === "Approved" && p.scheduledDate && <button disabled={!!busy} onClick={() => save({ postId: p.postId, status: "Scheduled" })} className="btn btn-sm !min-h-8 !px-3 bg-violet-700 text-xs text-white">Schedule</button>}
                    {["Approved", "Scheduled", "Failed", "Ready to Publish"].includes(p.status) && (
                      <button disabled={!!busy} onClick={() => publish(p)} className="btn btn-primary btn-sm !min-h-8 !px-3 text-xs">{busy === p.postId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Publish now</button>
                    )}
                    {p.publishedUrl && <a href={p.publishedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm !min-h-8 !px-3 text-xs"><ExternalLink className="h-3.5 w-3.5" />View</a>}
                    <button disabled={!!busy} onClick={() => remove(p)} aria-label="Delete" className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {shown.length === 0 && <p className="py-16 text-center text-muted">No posts yet. Use the Content Generator or Content Calendar to create drafts.</p>}
        </div>
      )}

      {tab === "generator" && (
        <Generator services={services} projects={projects} campaigns={campaigns} settings={settings} today={today} onSave={save} busy={busy === "save"} />
      )}

      {tab === "calendar" && (
        <Calendar initial={initialCalendar} posts={posts} services={services} projects={projects} settings={settings} today={today} onCreated={(ps) => { ps.forEach(upsert); setTab("posts"); setMsg(`${ps.length} draft posts created — review and approve them.`); }} />
      )}

      {editing && <Editor post={editing} campaigns={campaigns} busy={busy === "save"} onCancel={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function Editor({ post, campaigns, busy, onCancel, onSave }: { post: Partial<SocialPost>; campaigns: { id: string; name: string }[]; busy: boolean; onCancel: () => void; onSave: (p: Partial<SocialPost>) => void }) {
  const [p, setP] = useState(post);
  const set = (k: keyof SocialPost, v: string) => setP((x) => ({ ...x, [k]: v }));
  return (
    <div role="dialog" aria-modal="true" aria-label="Edit post" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <h2 className="text-2xl font-medium">{p.postId ? `Edit ${p.postId}` : "New post"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="label">Platform</span><select className="field" value={p.platform} onChange={(e) => set("platform", e.target.value)}>{SOCIAL_PLATFORMS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label><span className="label">Content type</span><select className="field" value={p.contentType} onChange={(e) => set("contentType", e.target.value)}>{CONTENT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="label">Caption</span><textarea rows={7} maxLength={2200} className="field" value={p.caption} onChange={(e) => set("caption", e.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Hashtags</span><input className="field" value={p.hashtags} onChange={(e) => set("hashtags", e.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Image URL(s) — public https links; one per line for carousels</span><textarea rows={2} className="field" value={p.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Video URL (Reels / Video)</span><input className="field" value={p.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} /></label>
          <label><span className="label">Scheduled date</span><input type="date" className="field" value={p.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} /></label>
          <label><span className="label">Scheduled time (IST)</span><input type="time" className="field" value={p.scheduledTime} onChange={(e) => set("scheduledTime", e.target.value)} /></label>
          <label><span className="label">Campaign</span><select className="field" value={p.campaignId} onChange={(e) => set("campaignId", e.target.value)}><option value="">None</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label><span className="label">Status</span><select className="field" value={p.status} onChange={(e) => set("status", e.target.value)}>{["Draft", "Approved", "Scheduled"].map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-outline btn-sm">Cancel</button>
          <button disabled={busy} onClick={() => onSave({ postId: p.postId, contentType: p.contentType, platform: p.platform, caption: p.caption, hashtags: p.hashtags, imageUrl: p.imageUrl, videoUrl: p.videoUrl, campaignId: p.campaignId, scheduledDate: p.scheduledDate, scheduledTime: p.scheduledTime, status: p.status })} className="btn btn-primary btn-sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Generator({ services, projects, campaigns, settings, today, onSave, busy }: {
  services: Props["services"]; projects: Props["projects"]; campaigns: Props["campaigns"]; settings: Props["settings"]; today: string; busy: boolean;
  onSave: (p: Partial<SocialPost>) => Promise<SocialPost[] | undefined>;
}) {
  const [f, setF] = useState({ topic: "Modular Kitchen", service: "", platform: "Instagram", contentType: "Image", tone: "Professional", project: "", cta: "Book a free consultation", campaignId: "", scheduledDate: today, scheduledTime: "18:30" });
  const [variant, setVariant] = useState(0);
  const project = projects.find((p) => p.id === f.project);
  const service = services.find((s) => s.slug === f.service);
  const out = generateContent({ ...f, service: service?.name || "", project: project?.name || "", city: project?.location || settings.city, company: settings.company, variant });
  const [caption, setCaption] = useState<string | null>(null);
  const [image, setImage] = useState("");
  const set = (k: keyof typeof f, v: string) => { setF((x) => ({ ...x, [k]: v })); setCaption(null); };
  const finalCaption = caption ?? out.caption;
  const img = image || project?.image || service?.image || "";

  const sel = (k: keyof typeof f, label: string, opts: { v: string; l: string }[]) => (
    <label><span className="label">{label}</span><select className="field" value={f[k]} onChange={(e) => set(k, e.target.value)}>{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
  );
  const o = (arr: readonly string[]) => arr.map((v) => ({ v, l: v }));

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_1fr]">
      <div className="card grid h-fit gap-4 p-5">
        {sel("topic", "Topic", o(TOPICS))}
        {sel("service", "Service", [{ v: "", l: "—" }, ...services.map((s) => ({ v: s.slug, l: s.name }))])}
        {sel("project", "Project", [{ v: "", l: "—" }, ...projects.map((p) => ({ v: p.id, l: p.name }))])}
        <div className="grid grid-cols-2 gap-3">
          {sel("platform", "Platform", o(SOCIAL_PLATFORMS))}
          {sel("contentType", "Content type", o(CONTENT_TYPES))}
        </div>
        {sel("tone", "Tone", o(TONES))}
        {sel("cta", "CTA", o(CTAS))}
        {sel("campaignId", "Campaign", [{ v: "", l: "None" }, ...campaigns.map((c) => ({ v: c.id, l: c.name }))])}
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-sans text-sm font-bold tracking-normal"><Sparkles className="h-4 w-4 text-brass" />Generated draft</h2>
          <button onClick={() => { setVariant((v) => v + 1); setCaption(null); }} className="btn btn-outline btn-sm"><Wand2 className="h-4 w-4" />Regenerate</button>
        </div>
        <label className="mt-4 block"><span className="label">Caption (editable)</span><textarea rows={10} className="field font-mono text-sm" value={finalCaption} onChange={(e) => setCaption(e.target.value)} /></label>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><span className="label">Short caption</span><p className="rounded-xl bg-stone p-3 text-sm">{out.shortCaption}</p></div>
          <div><span className="label">Hashtags</span><p className="rounded-xl bg-stone p-3 text-sm break-words">{out.hashtags}</p></div>
          <div className="md:col-span-2"><span className="label">Website content</span><p className="rounded-xl bg-stone p-3 text-sm">{out.websiteContent}</p></div>
          <label className="md:col-span-2"><span className="label">Image URL (defaults to the selected project/service image)</span><input className="field" value={img} onChange={(e) => setImage(e.target.value)} /></label>
          <label><span className="label">Date</span><input type="date" className="field" value={f.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} /></label>
          <label><span className="label">Time (IST)</span><input type="time" className="field" value={f.scheduledTime} onChange={(e) => set("scheduledTime", e.target.value)} /></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {(["Draft", "Approved"] as const).map((status) => (
            <button key={status} disabled={busy} onClick={() => onSave({ platform: f.platform, contentType: f.contentType, caption: finalCaption, hashtags: out.hashtags, imageUrl: img, campaignId: f.campaignId, scheduledDate: f.scheduledDate, scheduledTime: f.scheduledTime, status })} className={status === "Draft" ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "Draft" ? "Save as Draft" : "Save & Approve"}
            </button>
          ))}
          <button onClick={() => navigator.clipboard?.writeText(`${finalCaption}\n\n${out.hashtags}`)} className="btn btn-sm">Copy</button>
        </div>
      </div>
    </div>
  );
}

function Calendar({ initial, posts, services, projects, settings, today, onCreated }: {
  initial: CalendarEntry[]; posts: SocialPost[]; services: Props["services"]; projects: Props["projects"]; settings: Props["settings"]; today: string;
  onCreated: (p: SocialPost[]) => void;
}) {
  const [rows, setRows] = useState<CalendarEntry[]>(() => DAYS.map((d) => initial.find((r) => r.day === d) || { day: d, category: "Completed Project", serviceSlug: "", contentType: "Image", platform: "Instagram", time: "18:30", active: true }));
  const [state, setState] = useState("");
  const set = (i: number, k: keyof CalendarEntry, v: string | boolean) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  async function saveSchedule() {
    setState("saving");
    try {
      await api("/api/admin/calendar", { method: "PUT", body: JSON.stringify(rows) });
      setState("Schedule saved ✓");
    } catch (e) {
      setState((e as Error).message);
    }
  }

  const next7 = useMemo(() => {
    const out: { date: string; entry: CalendarEntry }[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      const day = DAYS[(d.getUTCDay() + 6) % 7];
      const entry = rows.find((r) => r.day === day);
      if (entry?.active) out.push({ date: d.toISOString().slice(0, 10), entry });
    }
    return out;
  }, [rows, today]);

  async function generateWeek() {
    setState("generating");
    const drafts = next7
      .filter(({ date, entry }) => !posts.some((p) => p.scheduledDate === date && p.platform === entry.platform))
      .map(({ date, entry }, i) => {
        const project = entry.category === "Completed Project" || entry.category === "Before & After" ? projects[i % Math.max(1, projects.length)] : undefined;
        const service = services.find((s) => s.slug === entry.serviceSlug);
        const g = generateContent({ topic: entry.category, service: service?.name || "", platform: entry.platform, contentType: entry.contentType, tone: "Professional", project: project?.name || "", cta: entry.category === "Factory / Manufacturing" ? "Visit our factory" : "Book a free consultation", city: project?.location || settings.city, company: settings.company, variant: i });
        return { platform: entry.platform, contentType: entry.contentType, caption: g.caption, hashtags: g.hashtags, imageUrl: project?.image || service?.image || "", scheduledDate: date, scheduledTime: entry.time, status: "Draft" as const };
      });
    if (!drafts.length) {
      setState("Every day in the next week already has a post.");
      return;
    }
    try {
      const { posts: created } = await api<{ posts: SocialPost[] }>("/api/admin/social", { method: "POST", body: JSON.stringify({ posts: drafts }) });
      onCreated(created);
    } catch (e) {
      setState((e as Error).message);
    }
  }

  const c = "field !min-h-10 !py-2 text-sm";
  return (
    <div className="mt-6 space-y-6">
      <div className="card overflow-x-auto p-5">
        <h2 className="font-sans text-sm font-bold tracking-normal">Weekly content schedule</h2>
        <p className="mt-1 text-sm text-muted">Set what goes out each day. Saved to the CONTENT_CALENDAR sheet.</p>
        <table className="mt-4 w-full min-w-[48rem] text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-2">Day</th><th>Category</th><th>Service</th><th>Platform</th><th>Type</th><th>Time</th><th>Active</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.day} className="border-t border-line">
                <td className="py-2 pr-2 font-semibold">{r.day}</td>
                <td className="pr-2"><select className={c} value={r.category} onChange={(e) => set(i, "category", e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></td>
                <td className="pr-2"><select className={c} value={r.serviceSlug} onChange={(e) => set(i, "serviceSlug", e.target.value)}><option value="">—</option>{services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></td>
                <td className="pr-2"><select className={c} value={r.platform} onChange={(e) => set(i, "platform", e.target.value)}>{SOCIAL_PLATFORMS.map((t) => <option key={t}>{t}</option>)}</select></td>
                <td className="pr-2"><select className={c} value={r.contentType} onChange={(e) => set(i, "contentType", e.target.value)}>{CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></td>
                <td className="pr-2"><input type="time" className={c} value={r.time} onChange={(e) => set(i, "time", e.target.value)} /></td>
                <td><input type="checkbox" className="h-4 w-4 accent-[var(--color-brass)]" checked={r.active} onChange={(e) => set(i, "active", e.target.checked)} aria-label={`${r.day} active`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={saveSchedule} className="btn btn-outline btn-sm">Save schedule</button>
          <button onClick={generateWeek} className="btn btn-primary btn-sm"><Wand2 className="h-4 w-4" />Generate drafts for next 7 days</button>
          {state && <span className="text-sm text-muted">{state === "saving" || state === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : state}</span>}
        </div>
      </div>
      <div className="card p-5">
        <h2 className="font-sans text-sm font-bold tracking-normal">Next 7 days</h2>
        <ul className="mt-3 divide-y divide-line">
          {next7.map(({ date, entry }) => {
            const existing = posts.filter((p) => p.scheduledDate === date);
            return (
              <li key={date} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="w-28 font-mono text-xs">{date}</span>
                <span className="font-semibold">{entry.category}</span>
                <span className="text-muted">{entry.platform} · {entry.contentType} · {entry.time}</span>
                <span className="ml-auto flex gap-1">{existing.length ? existing.map((p) => <StatusBadge key={p.postId} status={p.status} />) : <span className="text-xs text-muted">No post yet</span>}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
