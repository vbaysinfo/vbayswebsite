import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
// End-to-end test against a running production build in DEMO MODE (no APPS_SCRIPT_URL),
// started fresh with ADMIN_USERS="admin:test-password-123:admin":
//   npm run build && ADMIN_USERS=admin:test-password-123:admin PORT=3100 npm start
//   BASE_URL=http://localhost:3100 npm run test:e2e
// Set CHROMIUM_PATH if Chromium is not at the default Playwright location.
import { mkdirSync } from "node:fs";
const B = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2] || "test-results";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const ok = (m) => console.log("✓", m);

// Pages load without console errors
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error" && !/images\.unsplash|Failed to load resource/.test(m.text())) errors.push(`${page.url()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
for (const p of ["/", "/interiors", "/interiors/modular-kitchen", "/interiors/wardrobes/vizianagaram", "/projects", "/projects/3bhk-warm-contemporary", "/gallery", "/factory", "/contact", "/get-quote", "/sitemap.xml", "/robots.txt"]) {
  const r = await page.goto(B + p, { waitUntil: "networkidle" });
  assert.equal(r.status(), 200, p);
}
ok("12 public pages return 200");
const nf = await page.goto(B + "/interiors/does-not-exist");
assert.equal(nf.status(), 404);
ok("unknown service → 404");

await page.goto(B + "/", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/home-desktop.png` });
await page.screenshot({ path: `${OUT}/home-desktop-full.png`, fullPage: true });
const h1 = await page.locator("h1").first().textContent();
assert.match(h1, /Complete Interior Solutions/);
ok("hero headline present");

// Kitchen page SEO
await page.goto(B + "/interiors/modular-kitchen?utm_source=instagram&utm_medium=social&utm_campaign=kitchen_sep26", { waitUntil: "networkidle" });
assert.match(await page.title(), /Modular Kitchen in Visakhapatnam/);
const canonical = await page.locator('link[rel=canonical]').getAttribute("href");
assert.match(canonical, /\/interiors\/modular-kitchen$/);
const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
assert.ok(ld.some((t) => t.includes('"FAQPage"')) && ld.some((t) => t.includes('"Service"')));
ok("service page: dynamic {city} title, canonical, Service + FAQ schema");

// WhatsApp click tracking (UTM captured from landing URL)
const [trackRes] = await Promise.all([
  page.waitForResponse((r) => r.url().endsWith("/api/track")),
  page.locator('a[href^="https://wa.me/"]').filter({ hasText: "Get Quote on WhatsApp" }).first().click(),
]);
assert.equal(trackRes.status(), 204);
const attr = await page.evaluate(() => JSON.parse(localStorage.getItem("vb_attr_last")));
assert.equal(attr.utmCampaign, "kitchen_sep26");
assert.equal(attr.source, "Instagram");
ok("WhatsApp click tracked with page, service & UTM attribution");
const waHref = await page.locator('a[href^="https://wa.me/"]').filter({ hasText: "Get Quote on WhatsApp" }).first().getAttribute("href");
assert.match(decodeURIComponent(waHref), /Modular Kitchen Interior Design/);
ok("service-specific pre-filled WhatsApp message");

// Multi-step lead form on the home page
await page.goto(B + "/", { waitUntil: "load" }); await page.locator("#consultation form").scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
const form = page.locator("#consultation form");
await form.getByRole("button", { name: /^3BHK/ }).click();
await form.getByRole("button", { name: /Apartment/ }).click();
await form.getByRole("button", { name: /Ready to Move/ }).click();
await form.getByRole("button", { name: /₹5–10 Lakhs/ }).click();
await page.fill("#lf-name", "Priya Test");
await page.fill("#lf-phone", "12345");
await form.getByRole("button", { name: /Continue/ }).click();
await page.getByText("Enter a valid 10-digit mobile number").waitFor();
ok("invalid phone rejected client-side");
await page.fill("#lf-phone", "98765 43210");
await page.fill("#lf-email", "priya@example.com");
await form.getByRole("button", { name: /Continue/ }).click();
await page.fill("#lf-msg", "3BHK, need kitchen + wardrobes");
writeFileSync(`${OUT}/plan.pdf`, "%PDF-1.4\n% test floor plan\n");
await form.locator('input[type=file]').first().setInputFiles(`${OUT}/plan.pdf`);
await page.waitForTimeout(2600); // real humans take longer than the anti-bot minimum
await page.screenshot({ path: `${OUT}/form-step6.png` });
const [leadRes] = await Promise.all([
  page.waitForResponse((r) => r.url().endsWith("/api/lead")),
  form.getByRole("button", { name: /Get Free Consultation/ }).click(),
]);
const lj = await leadRes.json();
assert.equal(lj.ok, true);
assert.match(lj.leadId, /^VB\d{6}-\d{4}$/);
await page.getByText(lj.leadId).waitFor();
const afterWa = await page.locator('a', { hasText: "Continue on WhatsApp" }).getAttribute("href");
assert.ok(decodeURIComponent(afterWa).includes(`My Lead ID is ${lj.leadId}`));
await page.locator("#consultation").screenshot({ path: `${OUT}/form-success.png` });
ok(`lead submitted with upload → ${lj.leadId}, success + WhatsApp CTA with Lead ID`);

// Server-side validation, anti-spam, upload checks
const post = async (fields, file) => {
  const fd = new FormData();
  Object.entries({ name: "Bot", phone: "9876543210", submissionId: crypto.randomUUID(), elapsedMs: "9000", ...fields }).forEach(([k, v]) => fd.set(k, v));
  if (file) fd.set("floorPlan", new Blob([file.body], { type: file.type }), file.name);
  const r = await fetch(B + "/api/lead", { method: "POST", body: fd, headers: { "x-forwarded-for": fields.ip || `10.0.0.${Math.floor(Math.random() * 250)}` } });
  return { status: r.status, json: await r.json() };
};
let r = await post({ phone: "123" });
assert.equal(r.status, 422);
r = await post({ email: "not-an-email" });
assert.equal(r.status, 422);
r = await post({}, { body: "<html><script>alert(1)</script>", type: "application/pdf", name: "evil.pdf" });
assert.equal(r.status, 400);
assert.match(r.json.error, /Only PDF, JPG/);
r = await post({}, { body: new Uint8Array(6 * 1024 * 1024), type: "application/pdf", name: "big.pdf" });
assert.ok([400, 413].includes(r.status));
r = await post({ company_website: "spam.example" });
assert.equal(r.json.leadId, "VB-RECEIVED"); // silently dropped
// rate limit: 6th submission from one IP inside 10 minutes is refused
let last;
for (let i = 0; i < 6; i++) last = await post({ ip: "10.9.9.9", phone: "123" });
assert.equal(last.status, 429);
ok("rate limit: 429 after 5 submissions per IP");
ok("server validation: bad phone/email 422, spoofed & oversized uploads rejected, honeypot dropped");
const sid = crypto.randomUUID();
const d1 = await post({ ip: "10.1.1.1", name: "Dup Test", phone: "9811122233", requirement: "Wardrobe", submissionId: sid });
const d2 = await post({ ip: "10.1.1.1", name: "Dup Test", phone: "9811122233", requirement: "Wardrobe", submissionId: sid });
assert.equal(d1.json.leadId, d2.json.leadId);
assert.equal(d2.json.duplicate, true);
ok("duplicate submission returns same Lead ID");

// Admin protection
assert.equal((await fetch(B + "/api/admin/leads/x", { method: "PATCH", body: "{}" })).status, 401);
await page.goto(B + "/admin");
assert.match(page.url(), /\/admin\/login$/);
ok("admin + admin API protected (redirect / 401)");
await page.fill("#u", "admin");
await page.fill("#p", "wrong-password");
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByText("Invalid username or password.").waitFor();
await page.fill("#p", "test-password-123");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(B + "/admin");
await page.getByRole("heading", { name: "Dashboard" }).waitFor();
const total = await page.locator("a:has-text('Total Leads') p").nth(1).textContent();
assert.equal(total.trim(), "2");
await page.screenshot({ path: `${OUT}/admin-dashboard.png`, fullPage: true });
ok("admin login + dashboard shows 2 leads");

await page.goto(B + "/admin/leads", { waitUntil: "networkidle" });
await page.fill('input[placeholder^="Search"]', "Priya");
assert.equal(await page.locator("tbody tr").count(), 1);
await page.screenshot({ path: `${OUT}/admin-leads.png` });
await page.locator("tbody tr a").first().click();
await page.getByRole("heading", { name: "Priya Test" }).waitFor();
await page.getByRole("button", { name: "Site Visit" }).click();
await page.getByRole("button", { name: "+3 days" }).click();
await page.selectOption("#le-assign", "Designer 1");
await page.fill("#le-rm", "Called — visit on Saturday");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByText("Saved to Google Sheets ✓").waitFor();
await page.getByText(/· admin\] Called — visit on Saturday/).waitFor();
assert.ok(await page.getByText("floorPlan.pdf").count() > 0);
await page.screenshot({ path: `${OUT}/admin-lead.png`, fullPage: true });
ok("lead detail: status, follow-up, assignment, remarks saved; upload reference visible");

await page.goto(B + "/admin/social", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Content Generator/ }).click();
await page.getByRole("button", { name: "Save as Draft" }).click();
await page.getByText("Saved to Google Sheets.").waitFor();
await page.getByRole("button", { name: /Content Calendar/ }).click();
await page.getByRole("button", { name: /Generate drafts for next 7 days/ }).click();
await page.getByText(/draft posts created/).waitFor();
const cards = await page.locator("article").count();
assert.ok(cards >= 7, `expected >=7 posts, got ${cards}`);
await page.screenshot({ path: `${OUT}/admin-social.png` });
ok(`social: generator draft + calendar week generated (${cards} posts)`);

await page.goto(B + "/admin/campaigns", { waitUntil: "networkidle" });
const kitchenRow = page.locator("tr", { hasText: "kitchen_sep26" });
const cellsTxt = await kitchenRow.locator("td").allTextContents();
assert.equal(cellsTxt[5].trim(), "1", "WhatsApp clicks attributed to campaign");
ok("campaign metrics attribute WhatsApp click to kitchen_sep26");

// Mobile
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(B + "/", { waitUntil: "networkidle" });
await mp.screenshot({ path: `${OUT}/home-mobile.png` });
const bar = mp.locator("div.fixed.bottom-0");
assert.ok(await bar.isVisible());
assert.deepEqual((await bar.locator("a").allTextContents()).map((s) => s.trim()), ["Call", "WhatsApp", "Get Quote"]);
const scrollW = await mp.evaluate(() => document.documentElement.scrollWidth);
assert.ok(scrollW <= 390, `horizontal overflow: ${scrollW}`);
await mp.getByRole("button", { name: "Open menu" }).click();
await mp.screenshot({ path: `${OUT}/mobile-menu.png` });
await mp.goto(B + "/interiors/modular-kitchen", { waitUntil: "networkidle" });
await mp.screenshot({ path: `${OUT}/service-mobile.png`, fullPage: true });
ok("mobile: sticky [Call][WhatsApp][Get Quote] bar, no horizontal overflow, menu opens");

await page.goto(B + "/factory", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/factory.png`, fullPage: true });
await page.goto(B + "/gallery", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/gallery.png` });

console.log(errors.length ? `\nConsole errors:\n${errors.join("\n")}` : "\nNo console errors");
await browser.close();
