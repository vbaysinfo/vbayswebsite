# Acceptance checklist

Status key:
- ✅ implemented and verified by automated tests (headless-browser end-to-end run against the production build in demo mode, plus `npm run test:apps-script`)
- 🔌 implemented; needs your live credentials before it can be verified against the real service

| # | Criterion | Status | Where |
|---|---|---|---|
| 1 | Website is responsive | ✅ tested at 390px & 1440px, no horizontal overflow | all pages |
| 2 | Premium modern UI | ✅ | `src/app/globals.css`, `src/components/sections/*` |
| 3 | All pages work | ✅ 13 public routes return 200, unknown slug returns 404 | `src/app/(site)` |
| 4 | Services are dynamic | ✅ | SERVICES tab → `/interiors`, `/interiors/[slug]`, `/interiors/[slug]/[city]` |
| 5 | Projects are dynamic | ✅ | PROJECTS tab |
| 6 | Gallery is dynamic | ✅ | GALLERY + BEFORE_AFTER tabs |
| 7 | Factory section is dynamic | ✅ | FACTORY tab (process / capability / image rows) |
| 8 | Leads save to Google Sheets | ✅ Apps Script tests (mocked Sheets) · 🔌 live Sheet | `Code.gs → createLead_` |
| 9 | Unique Lead ID generated | ✅ `VB{yymmdd}-{0001}`, sequential per day under a lock | `nextSeq_` |
| 10 | WhatsApp integration works | ✅ service-specific + post-lead Lead-ID messages | `WhatsAppButton`, `WA_MESSAGES` |
| 11 | WhatsApp clicks tracked | ✅ EVENTS tab + GA4, with page/service/UTM | `/api/track` |
| 12 | Instagram integration configured | ✅ feed section, follow CTA, click tracking · 🔌 Graph API token | `InstagramSection`, `instagramFeed_` |
| 13 | Social content management | ✅ drafts, approval, scheduling, calendar, generator | `/admin/social` |
| 14 | Scheduled publishing where officially supported | ✅ mocked Graph API tests · 🔌 live Meta app | `Social.gs` |
| 15 | GA events configured | ✅ all 13 events fired from the UI · 🔌 GA4 ID | `src/lib/analytics.ts` |
| 16 | Google Maps integrated | ✅ office + factory embeds, directions | `MapCard`, contact & factory pages |
| 17 | SEO fields dynamic | ✅ `{city}` title/description/H1, canonical, JSON-LD verified | `generateMetadata`, `ServiceDetail` |
| 18 | UTM tracking works | ✅ captured on landing, attributed to lead + campaign metrics | `src/lib/attribution.ts` |
| 19 | Admin dashboard works | ✅ | `/admin` |
| 20 | Lead status management | ✅ | `/admin/leads`, `/admin/leads/[id]` |
| 21 | Follow-up management | ✅ follow-up date, assignment, remarks, due list, daily email digest | `LeadEditor`, `sendFollowUpDigest` |
| 22 | Secure file upload | ✅ spoofed type & >5 MB rejected, private Drive | `src/lib/server/uploads.ts`, `saveUploads_` |
| 23 | Anti-spam | ✅ honeypot, min-time, rate limit (429 verified), duplicate detection · optional Turnstile | `lead-handler.ts` |
| 24 | Customer data protected | ✅ admin pages redirect, admin APIs return 401 without a session, private routes need the secret | `proxy.ts`, `auth.ts`, `doGet` |
| 25 | Google credentials not exposed | ✅ no `NEXT_PUBLIC_` secrets; Apps Script is called only server-side | `src/lib/server/apps-script.ts` |
| 26 | Mobile sticky CTA | ✅ [Call] [WhatsApp] [Get Quote] | `MobileCTABar` |
| 27 | Content changeable through Sheets | ✅ | all CMS tabs + SETTINGS |
| 28 | Ready for CRM/project expansion | ✅ typed facade + single schema source | `backend.ts`, `sheet-schema.ts` |

## Content you still need to provide
- Real phone, WhatsApp number, email and addresses (SETTINGS). The current values are placeholders.
- Your own project, factory and service photos. The seed content uses stock photography URLs.
- Real, approved testimonials. The seed testimonial is inactive, so none are shown.
- Optional statistics (years of experience, projects completed, factory area). These appear only when filled in.
