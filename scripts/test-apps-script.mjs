// Runs the Apps Script backend against an in-memory mock of Google Sheets,
// Drive and services, exercising the real request routing end-to-end.
// Run: npm run test:apps-script
import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

// ─── Minimal Google Apps Script mocks ─────────────────────────────────────
class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sheet.cell(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  getDisplayValues() { return this.getValues().map((r) => r.map((v) => (typeof v === "string" && v.startsWith("'") ? v.slice(1) : String(v)))); }
  setValues(v) { v.forEach((row, i) => row.forEach((x, j) => this.sheet.set(this.r + i, this.c + j, x))); return this; }
  setValue(v) { this.sheet.set(this.r, this.c, v); return this; }
  clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sheet.set(this.r + i, this.c + j, ""); return this; }
}
for (const m of ["setNumberFormat", "setFontWeight", "setBackground", "setFontColor", "setVerticalAlignment", "setWrap", "setDataValidation"]) Range.prototype[m] = function () { return this; };

class Sheet {
  constructor(name) { this.name = name; this.rows = []; this.maxCols = 26; }
  getName() { return this.name; }
  cell(r, c) { return this.rows[r - 1]?.[c - 1] ?? ""; }
  set(r, c, v) {
    if (c > this.maxCols) throw new Error(`Column ${c} out of bounds in ${this.name}`);
    while (this.rows.length < r) this.rows.push([]);
    this.rows[r - 1][c - 1] = v;
  }
  getLastRow() { let n = this.rows.length; while (n && this.rows[n - 1].every((v) => v === "" || v === undefined)) n--; return n; }
  getLastColumn() { return Math.max(0, ...this.rows.map((r) => { let n = r.length; while (n && (r[n - 1] === "" || r[n - 1] === undefined)) n--; return n; })); }
  getMaxRows() { return 1000; }
  getMaxColumns() { return this.maxCols; }
  insertColumnsAfter(_a, n) { this.maxCols += n; }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  getDataRange() { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  appendRow(row) { const r = this.getLastRow() + 1; row.forEach((v, i) => this.set(r, i + 1, v)); }
  deleteRow(r) { this.rows.splice(r - 1, 1); }
  setFrozenRows() {}
}

const sheets = new Map();
const ss = {
  getSheetByName: (n) => sheets.get(n) || null,
  insertSheet: (n) => { const s = new Sheet(n); sheets.set(n, s); return s; },
  getSheets: () => [...sheets.values()],
  deleteSheet: (s) => sheets.delete(s.getName()),
  setSpreadsheetTimeZone() {},
  getUrl: () => "https://docs.google.com/spreadsheets/d/test",
  getId: () => "SHEET1",
  getName: () => ss.name,
};
// Mock Drive: folders by ID with subfolders, files and sharing state.
const folders = new Map();
const created = { spreadsheets: 0 };
function makeFolder(id, name) {
  const f = {
    id, name, sharing: "inherited", children: [], fileList: [],
    getId: () => id,
    getName: () => name,
    getFoldersByName: (n) => iter(f.children.filter((c) => c.name === n)),
    createFolder: (n) => { const c = makeFolder(`${id}/${n}`, n); f.children.push(c); return c; },
    getFilesByName: (n) => iter(f.fileList.filter((x) => x.name === n)),
    getFiles: () => iter(f.fileList),
    createFile: (blob) => createFile(blob, f),
    setSharing: (a) => { f.sharing = a; },
  };
  folders.set(id, f);
  return f;
}
const iter = (arr) => { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; };
const DRIVE_FOLDER = "1_eMSIYfdKgBis4sOaWs_yKBbAmH0-yRu";
makeFolder(DRIVE_FOLDER, "Client folder");
const props = new Map();
const cache = new Map();
const mails = [];
const files = [];
const fetches = [];
const triggers = [];
const trashed = [];

const ctx = {
  console,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => null, // standalone script (script.google.com)
    create: (name) => { created.spreadsheets++; ss.name = name; return ss; },
    openById: (id) => { if (id !== "SHEET1") throw new Error("not found"); return ss; },
    getActive: () => ({ toast() {} }),
    flush() {},
    newDataValidation: () => { const b = { requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; },
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t) => ({ text: t, getContent: () => t, setMimeType() { return this; } }) },
  MailApp: { sendEmail: (to, subject, body) => mails.push({ to, subject, body }) },
  DriveApp: {
    Access: { PRIVATE: "PRIVATE" },
    Permission: { NONE: "NONE" },
    getFolderById: (id) => { const f = folders.get(id); if (!f) throw new Error("No folder"); return f; },
    getFileById: (id) => ({ setTrashed() { trashed.push(id); }, moveTo: (folder) => { ss.parent = folder.getId(); folder.fileList.push({ name: ss.name, getId: () => id }); } }),
  },
  UrlFetchApp: { fetch: (url, opts) => { fetches.push({ url, opts }); return { getResponseCode: () => 200, getContentText: () => JSON.stringify(mockGraph(url, opts)), getBlob: () => ({ name: "", setName(n) { this.name = n; return this; } }) }; } },
  ScriptApp: { getOAuthToken: () => "tok", getProjectTriggers: () => [], newTrigger: (fn) => { const b = { timeBased: () => b, everyMinutes: () => b, atHour: () => b, everyDays: () => b, inTimezone: () => b, everyHours: () => b, forSpreadsheet: () => b, onEdit: () => b, onOpen: () => b, create: () => { triggers.push(fn); return b; } }; return b; } },
  Utilities: {
    formatDate: (d, _tz, fmt) => {
      const ist = new Date(d.getTime() + 5.5 * 3600e3);
      const p = (n) => String(n).padStart(2, "0");
      const map = { yyyy: ist.getUTCFullYear(), yy: String(ist.getUTCFullYear()).slice(2), MM: p(ist.getUTCMonth() + 1), dd: p(ist.getUTCDate()), HH: p(ist.getUTCHours()), mm: p(ist.getUTCMinutes()), ss: p(ist.getUTCSeconds()) };
      return fmt.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (t) => map[t]);
    },
    getUuid: () => crypto.randomUUID(),
    base64Decode: (s) => [...Buffer.from(s, "base64")],
    base64Encode: (s) => Buffer.from(s).toString("base64"),
    newBlob: (bytes, mime, name) => ({ bytes, mime, name }),
    sleep() {},
  },
};
function createFile(blob, folder) {
  const file = { name: blob.name, folder: folder?.name, sharing: "inherited", created: Date.now() + folder.fileList.length,
    getUrl: () => `https://drive.google.com/file/d/FILEID${String(files.length).padStart(24, "0")}/view`, setDescription() {},
    setSharing(a) { file.sharing = a; }, getDateCreated: () => file.created, setTrashed() { folder.fileList = folder.fileList.filter((x) => x !== file); } };
  files.push(file);
  folder.fileList.push(file);
  return file;
}
function mockGraph(url) {
  if (url.includes("/media_publish")) return { id: "MEDIA1" };
  if (url.includes("fields=permalink")) return { permalink: "https://www.instagram.com/p/abc/" };
  if (url.includes("fields=status_code")) return { status_code: "FINISHED" };
  if (url.includes("/media")) return { id: "CONTAINER1" };
  return {};
}

vm.createContext(ctx);
for (const f of process.env.BUNDLE ? ["dist/Code.gs"] : ["Schema.gs", "Code.gs", "Social.gs", "Setup.gs"]) vm.runInContext(readFileSync(new URL(`../apps-script/${f}`, import.meta.url), "utf8"), ctx, { filename: f });

const post = (route, data = {}, secret = props.get("API_SECRET")) =>
  JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ route, secret, data }) } }).text);

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log("✓", name); };

// ─── Tests ────────────────────────────────────────────────────────────────
test("setup creates the spreadsheet inside the client Drive folder (standalone)", () => {
  const msg = ctx.setup();
  assert.equal(created.spreadsheets, 1);
  assert.equal(ss.parent, DRIVE_FOLDER);
  assert.equal(props.get("SPREADSHEET_ID"), "SHEET1");
  const root = folders.get(DRIVE_FOLDER);
  assert.deepEqual(root.children.map((c) => c.name).sort(), ["Excel Backups", "Lead Uploads (private)"]);
  assert.ok(root.children.every((c) => c.sharing === "PRIVATE"), "subfolders are private");
  assert.match(msg, /Spreadsheet: https:/);
  ctx.setup();
  assert.equal(created.spreadsheets, 1, "re-running setup reuses the same spreadsheet");
});

test("setup creates all sheets with headers and seed data", () => {
  for (const n of Object.keys(ctx.SCHEMA)) assert.ok(sheets.get(n), `missing ${n}`);
  assert.equal(sheets.get("LEADS").cell(1, 32), "Submission ID");
  assert.ok(props.get("API_SECRET")?.length > 40);
  ctx.setup(); // idempotent
  assert.equal(sheets.get("SERVICES").getLastRow(), 13);
});

test("rejects bad secret", () => {
  assert.equal(post("content", {}, "wrong").code, "UNAUTHORIZED");
});

test("content bundle returns camelCase CMS data; testimonials hidden until approved", () => {
  const r = post("content");
  assert.equal(r.ok, true);
  assert.equal(r.data.settings.companyName, "VBays Interiors");
  assert.equal(r.data.settings.whatsappNumber, "919581909904");
  assert.equal(r.data.services.length, 12);
  assert.equal(r.data.services[1].slug, "modular-kitchen");
  assert.ok(r.data.services[0].seoTitle.includes("{city}"));
  assert.ok(r.data.services[0].faqs.includes("::"));
  assert.equal(r.data.testimonials.length, 0);
});

test("public GET works without secret and exposes no private routes", () => {
  const ok = JSON.parse(ctx.doGet({ parameter: { route: "services" } }).text);
  assert.equal(ok.data.length, 12);
  const bad = JSON.parse(ctx.doGet({ parameter: { route: "admin/leads" } }).text);
  assert.equal(bad.ok, false);
});

let leadId;
test("lead creation: ID, uploads to private Drive, attribution, email", () => {
  props.set("NOTIFY_EMAIL", "owner@example.com");
  const r = post("lead", {
    name: "Test Customer", phone: "+919876543210", whatsapp: "+919876543210", email: "t@example.com", city: "Visakhapatnam",
    requirement: "Modular Kitchen", budget: "₹5–10 Lakhs", propertyType: "Apartment", propertyStatus: "Ready to Move",
    submissionId: "sub-12345678", message: "=HYPERLINK(\"evil\")",
    attribution: { source: "Instagram", utmSource: "instagram", utmMedium: "social", utmCampaign: "kitchen_sep26", campaign: "kitchen_sep26" },
    uploads: [{ field: "floorPlan", mimeType: "application/pdf", base64: Buffer.from("%PDF-1.4 test").toString("base64") }],
  });
  assert.equal(r.ok, true, JSON.stringify(r));
  leadId = r.data.leadId;
  assert.match(leadId, /^VB\d{6}-0001$/);
  assert.equal(files.length, 1);
  assert.match(files[0].name, /^VB\d{6}-0001-floorPlan\.pdf$/);
  assert.equal(files[0].folder, "Lead Uploads (private)");
  assert.equal(files[0].sharing, "PRIVATE");
  const lead = post("admin/leads").data[0];
  assert.equal(lead.status, "New");
  assert.equal(lead.phone, "+919876543210", "phone kept as text");
  assert.equal(lead.message, '=HYPERLINK("evil")', "formula neutralised (stored with leading apostrophe)");
  assert.equal(sheets.get("LEADS").cell(2, 14).startsWith("'="), true);
  assert.equal(lead.utmCampaign, "kitchen_sep26");
  assert.ok(lead.fileUrl.startsWith("https://drive.google.com/"));
  assert.equal(mails.length, 1);
});

test("duplicate submission returns the same lead ID", () => {
  const again = post("lead", { name: "Test Customer", phone: "+919876543210", requirement: "Modular Kitchen", submissionId: "sub-12345678" });
  assert.deepEqual(again.data, { leadId, duplicate: true });
  const quick = post("lead", { name: "Test Customer", phone: "+919876543210", requirement: "Modular Kitchen", submissionId: "different-99" });
  assert.equal(quick.data.duplicate, true);
  const other = post("contact", { name: "Other", phone: "+919876500000", requirement: "", submissionId: "sub-other-1" });
  assert.match(other.data.leadId, /-0002$/);
});

test("rejects disallowed upload types", () => {
  const r = post("lead", { name: "X", phone: "+919811111111", submissionId: "sub-x-123456", uploads: [{ field: "floorPlan", mimeType: "text/html", base64: "PGgxPg==" }] });
  assert.equal(r.ok, false);
});

test("lead update: status, follow-up, remarks history", () => {
  const r = post("admin/lead-update", { leadId, actor: "admin", update: { status: "Site Visit", followUpDate: "2026-09-25", assignedTo: "Designer 1", remarks: "Visit booked" } });
  assert.equal(r.data.status, "Site Visit");
  assert.equal(r.data.followUpDate, "2026-09-25");
  assert.match(r.data.remarks, /· admin\] Visit booked/);
  assert.equal(post("admin/lead-update", { leadId, update: { status: "Bogus" } }).ok, false);
});

test("events + campaign metrics are computed from real data", () => {
  post("event", { eventType: "whatsapp_click", page: "/interiors/modular-kitchen", service: "modular-kitchen", attribution: { source: "Instagram", utmCampaign: "kitchen_sep26" } });
  post("event", { eventType: "call_click", page: "/", attribution: { utmCampaign: "kitchen_sep26" } });
  const sum = post("admin/event-summary").data;
  assert.equal(sum.byType.whatsapp_click, 1);
  const c = post("admin/campaigns").data[0];
  assert.deepEqual([Number(c.leads), Number(c.whatsappClicks), Number(c.calls)], [1, 1, 1]);
  const saved = post("admin/campaign-save", { campaign: { campaignName: "Wardrobes — FB", utmCampaign: "wardrobe_oct" } }).data;
  assert.match(saved.campaignId, /^CMP\d{6}-001$/);
});

test("social: draft → approve → schedule → publish via Instagram API", () => {
  const d = post("social-post", { post: { platform: "Instagram", contentType: "Image", caption: "Hello", hashtags: "#x", imageUrl: "https://example.com/a.jpg" } }).data;
  assert.equal(d.status, "Draft");
  assert.equal(post("admin/social-publish", { postId: d.postId }).ok, false, "drafts cannot be published");
  assert.equal(post("social-post", { post: { postId: d.postId, status: "Scheduled" } }).ok, false, "schedule needs date/time");
  post("social-post", { post: { postId: d.postId, status: "Approved", scheduledDate: "2020-01-01", scheduledTime: "10:00" } });
  // Not connected → honest "Ready to Publish"
  const notConnected = post("admin/social-publish", { postId: d.postId }).data;
  assert.equal(notConnected.status, "Ready to Publish");
  props.set("IG_USER_ID", "123");
  props.set("META_ACCESS_TOKEN", "tok");
  post("social-post", { post: { postId: d.postId, status: "Scheduled" } });
  ctx.processScheduledPosts();
  const after = post("admin/social").data.find((p) => p.postId === d.postId);
  assert.equal(after.status, "Published");
  assert.equal(after.publishedUrl, "https://www.instagram.com/p/abc/");
  assert.ok(fetches.some((f) => f.url.includes("/123/media_publish")));
});

test("social: unsupported platform is marked Ready to Publish (never faked)", () => {
  const y = post("social-post", { post: { platform: "YouTube", contentType: "Video", caption: "v", status: "Approved" } }).data;
  const r = post("admin/social-publish", { postId: y.postId }).data;
  assert.equal(r.status, "Ready to Publish");
});

test("content calendar save & read", () => {
  const rows = post("admin/calendar-save", { entries: [{ day: "Monday", category: "Modular Kitchen", serviceSlug: "modular-kitchen", contentType: "Reel", platform: "Instagram", time: "19:00", active: true }] }).data;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].contentType, "Reel");
});

test("follow-up digest emails due leads", () => {
  post("admin/lead-update", { leadId, update: { followUpDate: "2026-01-01" } });
  const before = mails.length;
  ctx.sendFollowUpDigest();
  assert.equal(mails.length, before + 1);
  assert.match(mails.at(-1).body, new RegExp(leadId));
});

test("triggers include daily Excel backup; backup keeps latest 14 .xlsx files", () => {
  ctx.setupTriggers();
  assert.ok(triggers.includes("exportExcelBackup") && triggers.includes("onOpen") && triggers.includes("processScheduledPosts"));
  for (let i = 0; i < 16; i++) ctx.exportExcelBackup();
  const backups = folders.get(DRIVE_FOLDER).children.find((c) => c.name === "Excel Backups").fileList;
  assert.equal(backups.length, 14);
  assert.match(backups[0].name, /\.xlsx$/);
  assert.ok(fetches.some((f) => f.url.includes("/spreadsheets/d/SHEET1/export?format=xlsx")));
});

test("selfTest() passes against the configured sheet and cleans up after itself", () => {
  const leadsBefore = sheets.get("LEADS").getLastRow();
  const eventsBefore = sheets.get("EVENTS").getLastRow();
  const report = ctx.selfTest();
  assert.match(report, /ALL CHECKS PASSED/, report);
  assert.equal(sheets.get("LEADS").getLastRow(), leadsBefore);
  assert.equal(sheets.get("EVENTS").getLastRow(), eventsBefore);
  assert.equal(trashed.length, 1);
});

console.log(`\n${passed} Apps Script tests passed`);
