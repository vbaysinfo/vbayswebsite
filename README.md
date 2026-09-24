# VBays Interiors — Website, Lead CRM & Marketing Automation

Premium interior-design website for a company with its **own modular factory**, connected to a lightweight CRM and social-media automation system that runs on **Google Sheets**.

> *We don't just design interiors — we design, manufacture and install complete modular interiors.*

```
Visitor ─▶ Next.js website ─▶ /api/* (server) ─▶ Google Apps Script API ─▶ Google Sheets / Drive
                │                    │                        │
                │                    │                        ├─▶ Instagram Graph API / Facebook Pages API
                ▼                    ▼                        └─▶ Gmail alerts & follow-up digest
        WhatsApp · Call · GA4   Admin dashboard (login)
```

- **Website** — Next.js 16 (App Router, Cache Components, Turbopack), React 19, Tailwind CSS v4.
- **API layer** — Google Apps Script web app (`apps-script/`). The URL and secret live **only** in server env vars; browsers never talk to Apps Script or see any credential.
- **Database / CMS** — one Google Sheet, created automatically by `setup()` in the Drive folder [`1_eMSIYfdKgBis4sOaWs_yKBbAmH0-yRu`](https://drive.google.com/drive/folders/1_eMSIYfdKgBis4sOaWs_yKBbAmH0-yRu) together with a private uploads folder and daily Excel (.xlsx) backups. It has 12 tabs (settings, services, projects, gallery, before/after, testimonials, factory, leads, events, social posts, content calendar, campaigns).

## Features

| Area | What's included |
|---|---|
| Pages | Home, Interiors, 12 dynamic service pages `/interiors/{slug}`, local-SEO pages `/interiors/{slug}/{city}` for every service area, Projects + detail, Gallery (filters, lightbox, before/after), Factory, About, Contact, Get Quote |
| Lead generation | 6-step smart form (requirement → property → status → budget → contact → details + floor plan / reference uploads), unique Lead ID, success screen with WhatsApp message pre-filled with the Lead ID, contact form |
| WhatsApp | Buttons throughout (Chat, Get Quote, Discuss Your Interior, Send Floor Plan, Talk to Designer, Get Similar Design, Visit Factory) with service-specific pre-filled messages; every click is logged to Sheets and GA4 |
| Mobile | Sticky bottom bar **[Call] [WhatsApp] [Get Quote]**, click-to-call, large tap targets, full-screen menu |
| Attribution | UTM source/medium/campaign/content + referrer/gclid/fbclid → Source (Website, WhatsApp, Instagram, Facebook, Google, YouTube, Referral, Direct, Other), first- and last-touch, saved with every lead and event |
| Analytics | GA4 events: `page_view`, `service_view`, `project_view`, `lead_form_start`, `lead_form_submit`, `whatsapp_click`, `call_click`, `quote_request`, `floor_plan_upload`, `instagram_click`, `google_maps_click`, `factory_visit_request`, `consultation_request` |
| Admin (login) | Dashboard (14 KPIs, leads by month/source/service/status, follow-ups due, campaign performance), lead management (search/filter/sort, status pipeline, assign staff, follow-up & last-contact dates, remarks history, call/WhatsApp, private file links, CSV export), social media manager, content generator, content calendar, campaigns + UTM link builder, CMS status & cache refresh |
| Social automation | Draft → Approved → Scheduled → Publishing → Published / Failed, with the published URL written back to the Sheet. Instagram (image, carousel, reel, story) and Facebook (photo, multi-photo, video) through the official Graph APIs. Anything else is marked **Ready to Publish**, never faked as published |
| Follow-ups | New leads start at `New`, and staff move them through `Contacted → Follow-up → Site Visit → Design → Quotation → Negotiation → Confirmed → Completed` or `Lost`. Instant email alert for each new lead and a daily 9 AM digest of due follow-ups |
| SEO | Dynamic title/description/H1/alt/canonical from Sheets (`{city}` placeholder, no hard-coded city), JSON-LD (HomeAndConstructionBusiness, Service, FAQPage, BreadcrumbList), sitemap, robots, Search Console verification |
| Security | Server-only credentials, zod validation, Indian/intl phone and email validation, magic-byte upload checks (PDF/JPG/PNG/WEBP, 5 MB, re-checked in Apps Script), private Drive storage, honeypot + minimum time + optional Cloudflare Turnstile, per-IP rate limits, duplicate-submission detection, signed httpOnly admin sessions, admin/staff roles, `proxy.ts` + per-route auth checks, formula-injection protection in Sheets, security headers, `noindex` admin |
| Resilience | If Sheets is unreachable, the site keeps running on built-in content. Form failures show *"We couldn't submit your enquiry right now. Please try WhatsApp or call us directly."* with WhatsApp/Call buttons. Internal errors are never shown to customers |

## Quick start (demo mode — no Google setup needed)

```bash
npm install
cp .env.example .env.local        # leave APPS_SCRIPT_URL blank for demo mode
npm run dev                        # http://localhost:3000  ·  admin: /admin (admin / change-me-please)
```

In **demo mode** the site uses the seed content in `src/data/seed.ts`, and leads/events/posts are kept in memory. The admin shows a *DEMO MODE* badge.

## Going live

Follow **[docs/SETUP.md](docs/SETUP.md)**: create the Sheet, install the Apps Script, set Script Properties, deploy the web app, then set the website env vars and deploy (e.g. Vercel).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run test:apps-script` | Runs the Apps Script backend against an in-memory Sheets/Drive mock (15 end-to-end tests) |
| `npm run gen:apps-script` | Regenerates `apps-script/Schema.gs` (sheet headers + seed rows) from `src/lib/sheet-schema.ts` and `src/data/seed.ts` |

## Project structure

```
apps-script/          Google Apps Script API (Code.gs, Social.gs, Setup.gs, Schema.gs, appsscript.json)
docs/                 Setup guide & acceptance checklist
scripts/              Apps Script code generator + test harness
src/proxy.ts          Admin route protection (Next 16 "proxy", formerly middleware)
src/app/(site)/       Public website
src/app/admin/        Admin login + panel (dashboard, leads, social, campaigns, content)
src/app/api/          lead, contact, track, revalidate, admin/*
src/components/       UI, sections, forms, CTA, admin
src/lib/server/       Server-only: Apps Script client, content cache, backend facade, auth, rate limit, uploads
src/lib/              Types, normalisation, validation, analytics, attribution, content generator, SEO
src/data/             Seed content + structural brand copy
```

## Built for future expansion

Every data operation goes through one facade (`src/lib/server/backend.ts`) with typed contracts (`src/lib/types.ts`). The Sheet schema is defined in a single place (`src/lib/sheet-schema.ts`). Adding quotations, production tracking, installation tracking or customer/staff/designer logins means adding a tab, a route in `Code.gs` and a page. You could also replace Sheets with a database later without touching the UI. The lead pipeline statuses already mirror the business flow: Lead → Site Visit → Design → Quotation → Approval → Production → Installation → Handover.
