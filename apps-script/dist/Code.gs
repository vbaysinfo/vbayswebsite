/**
 * VBays Interiors — Website API (single-file bundle, generated — edit apps-script/*.gs instead)
 *
 * HOW TO INSTALL (5 minutes):
 *   1. script.google.com → New project → rename it "VBays Interiors API"
 *   2. Select all in Code.gs, delete, and paste THIS WHOLE FILE. Save (Ctrl+S).
 *   3. Project Settings (gear icon) → tick "Show appsscript.json manifest file in editor"
 *      → open appsscript.json → replace it with apps-script/dist/appsscript.json. Save.
 *   4. Function dropdown → setup → Run → Review permissions → choose your account → Allow.
 *      The log shows the new spreadsheet link (created in your Drive folder).
 *   5. Function dropdown → setupTriggers → Run. Then selfTest → Run → log must say ALL CHECKS PASSED.
 *   6. Deploy → New deployment → gear → Web app → Execute as: Me, Who has access: Anyone
 *      → Deploy → copy the Web app URL.
 *   7. Project Settings → Script Properties → copy API_SECRET.
 *   Put the URL and secret into the website env vars APPS_SCRIPT_URL / APPS_SCRIPT_SECRET.
 */

// ════════════════ Setup.gs ════════════════

/**
 * One-time setup & admin menu.
 *   1. Go to script.google.com → New project (a standalone script — no sheet needed).
 *   2. Add Code.gs, Social.gs, Setup.gs, Schema.gs and appsscript.json from this folder.
 *   3. Run setup() once and approve the permissions. It automatically:
 *        • creates the "VBays Interiors — Website Data" spreadsheet INSIDE the Drive folder below
 *        • creates all 12 tabs with headers, drop-downs and starter content
 *        • creates private "Lead Uploads (private)" and "Excel Backups" subfolders
 *        • generates API_SECRET (Project Settings → Script Properties)
 *      Re-running setup() is safe: it reuses the same spreadsheet and never deletes data.
 *   4. Run setupTriggers() once.
 *   5. Deploy → New deployment → Web app (Execute as: Me · Access: Anyone) → copy the URL
 *      into the website's APPS_SCRIPT_URL environment variable.
 *
 * (Alternatively paste the files into a sheet's Extensions → Apps Script; then that sheet is used.)
 */

// Google Drive folder that holds the spreadsheet, customer uploads and Excel backups.
// https://drive.google.com/drive/folders/1_eMSIYfdKgBis4sOaWs_yKBbAmH0-yRu
// Override without editing code via the DRIVE_FOLDER_ID Script Property.
var DEFAULT_DRIVE_FOLDER_ID = '1_eMSIYfdKgBis4sOaWs_yKBbAmH0-yRu';
var SPREADSHEET_NAME = 'VBays Interiors — Website Data';
var BACKUPS_TO_KEEP = 14;

function driveFolder_() {
  var id = prop_('DRIVE_FOLDER_ID') || DEFAULT_DRIVE_FOLDER_ID;
  try {
    return DriveApp.getFolderById(id);
  } catch (err) {
    throw withCode_(new Error('Cannot open Drive folder ' + id + '. Run this script with the Google account that owns (or can edit) that folder.'), 'NOT_CONFIGURED');
  }
}

function subfolder_(name) {
  var parent = driveFolder_();
  var it = parent.getFoldersByName(name);
  var folder = it.hasNext() ? it.next() : parent.createFolder(name);
  makePrivate_(folder);
  return folder;
}

/** Turns off link-sharing so customer files are never publicly accessible. */
function makePrivate_(item) {
  try {
    item.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (err) {
    console.warn('Could not change sharing (domain policy?): ' + err);
  }
}

/** Finds or creates the website spreadsheet inside the Drive folder and remembers its ID. */
function ensureSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (err) { /* deleted — recreate below */ }
  }
  var bound = SpreadsheetApp.getActiveSpreadsheet();
  if (bound) {
    props.setProperty('SPREADSHEET_ID', bound.getId());
    return bound;
  }
  var folder = driveFolder_();
  var existing = folder.getFilesByName(SPREADSHEET_NAME);
  var ss = existing.hasNext() ? SpreadsheetApp.openById(existing.next().getId()) : SpreadsheetApp.create(SPREADSHEET_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  props.setProperty('SPREADSHEET_ID', ss.getId());
  ss__ = ss;
  return ss;
}

/**
 * Daily .xlsx (Excel) backup of the whole spreadsheet into "Excel Backups",
 * keeping the latest BACKUPS_TO_KEEP files. Contains customer data → private folder.
 */
function exportExcelBackup() {
  var ss = ss_();
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx';
  var blob = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
  var folder = subfolder_('Excel Backups');
  var file = folder.createFile(blob.setName(SPREADSHEET_NAME + ' ' + now_().date + '.xlsx'));
  makePrivate_(file);
  var files = [];
  var it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(BACKUPS_TO_KEEP).forEach(function (f) { f.setTrashed(true); });
  return file.getUrl();
}

var TEXT_SHEETS = ['SETTINGS', 'SERVICES', 'PROJECTS', 'GALLERY', 'BEFORE_AFTER', 'TESTIMONIALS', 'FACTORY', 'LEADS', 'EVENTS', 'SOCIAL_POSTS', 'CONTENT_CALENDAR', 'CAMPAIGNS'];
var PRIVATE_SHEETS = ['LEADS', 'EVENTS'];

function setup() {
  var ss = ensureSpreadsheet_();
  ss.setSpreadsheetTimeZone(TZ);
  TEXT_SHEETS.forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = SCHEMA[name];
    var existing = sh.getLastColumn() ? headers_(sh) : [];
    var needed = Math.max(headers.length, existing.length) + headers.filter(function (h) { return existing.length && existing.indexOf(h) === -1; }).length;
    if (sh.getMaxColumns() < needed) sh.insertColumnsAfter(sh.getMaxColumns(), needed - sh.getMaxColumns());
    // Plain-text format keeps phones (+91…), dates and IDs exactly as typed.
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setNumberFormat('@');
    if (!existing.length || existing.join('') === '') {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      var seed = SEED[name];
      if (seed && seed.length && sh.getLastRow() < 2) {
        sh.getRange(2, 1, seed.length, seed[0].length).setValues(seed.map(function (r) { return r.map(safe_); }));
      }
    } else {
      // Add any new columns introduced by later versions without touching data.
      headers.forEach(function (h) {
        if (existing.indexOf(h) === -1) sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
      });
    }
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#1c1a17').setFontColor('#ffffff');
    sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), sh.getLastColumn()).setVerticalAlignment('top').setWrap(false);
  });
  addValidation_();
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  if (!prop_('API_SECRET')) {
    PropertiesService.getScriptProperties().setProperty('API_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  uploadFolder_();
  subfolder_('Excel Backups');
  var msg = 'Setup complete. Spreadsheet: ' + ss.getUrl() + ' — API_SECRET is in Project Settings → Script Properties.';
  console.log(msg);
  return msg;
}

function addValidation_() {
  var dv = function (list) { return SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build(); };
  var col = function (name, header) {
    var sh = sheet_(name);
    var i = headers_(sh).indexOf(header) + 1;
    return i ? sh.getRange(2, i, sh.getMaxRows() - 1, 1) : null;
  };
  var set = function (name, header, list) { var r = col(name, header); if (r) r.setDataValidation(dv(list)); };
  set('LEADS', 'Status', LEAD_STATUSES);
  set('SOCIAL_POSTS', 'Status', SOCIAL_STATUSES);
  set('SOCIAL_POSTS', 'Platform', ['Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'Pinterest']);
  set('SOCIAL_POSTS', 'Content Type', ['Image', 'Carousel', 'Reel', 'Video', 'Story']);
  set('FACTORY', 'Type', ['process', 'capability', 'image']);
  ['SERVICES', 'PROJECTS', 'GALLERY', 'BEFORE_AFTER', 'TESTIMONIALS', 'FACTORY', 'CONTENT_CALENDAR'].forEach(function (n) { set(n, 'Active', ['TRUE', 'FALSE']); });
  ['SERVICES', 'PROJECTS'].forEach(function (n) { set(n, 'Featured', ['TRUE', 'FALSE']); });
}

function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('processScheduledPosts').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('sendFollowUpDigest').timeBased().atHour(9).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('recomputeCampaigns').timeBased().everyHours(6).create();
  ScriptApp.newTrigger('exportExcelBackup').timeBased().atHour(2).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss_()).onEdit().create();
  // Standalone script: install onOpen so the "Website" menu appears in the sheet.
  // (A sheet-bound script already gets it from the simple onOpen trigger.)
  if (!SpreadsheetApp.getActiveSpreadsheet()) ScriptApp.newTrigger('onOpen').forSpreadsheet(ss_()).onOpen().create();
  return 'Triggers installed.';
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Refresh website now', 'menuRefresh_')
    .addItem('Publish due social posts now', 'processScheduledPosts')
    .addItem('Recalculate campaign metrics', 'recomputeCampaigns')
    .addItem('Send follow-up digest now', 'sendFollowUpDigest')
    .addItem('Save Excel (.xlsx) backup now', 'exportExcelBackup')
    .addSeparator()
    .addItem('Run setup (safe to re-run)', 'setup')
    .addItem('Install triggers', 'setupTriggers')
    .addToUi();
}

function menuRefresh_() {
  SpreadsheetApp.getActive().toast(refreshWebsite(), 'Website', 5);
}

/**
 * One-click health check — run from the editor after setup().
 * Exercises the real spreadsheet, Drive folder and API routes, then removes
 * its own test data. Read the result in the Execution log.
 */
function selfTest() {
  var results = [];
  var check = function (name, fn) {
    try {
      var detail = fn();
      results.push('PASS  ' + name + (detail ? ' — ' + detail : ''));
    } catch (err) {
      results.push('FAIL  ' + name + ' — ' + (err && err.message || err));
    }
  };
  var secret = prop_('API_SECRET');
  var call = function (route, data) {
    var out = JSON.parse(doPost({ postData: { contents: JSON.stringify({ route: route, secret: secret, data: data || {} }) } }).getContent());
    if (!out.ok) throw new Error(out.error);
    return out.data;
  };
  var leadId = '';
  var fileUrl = '';

  check('Drive folder', function () { return driveFolder_().getName(); });
  check('Spreadsheet in folder', function () { return ss_().getName() + ' → ' + ss_().getUrl(); });
  check('All 12 tabs with headers', function () {
    TEXT_SHEETS.forEach(function (n) {
      var hs = headers_(sheet_(n));
      SCHEMA[n].forEach(function (h) { if (hs.indexOf(h) === -1) throw new Error(n + ' missing column ' + h); });
    });
    return TEXT_SHEETS.length + ' tabs OK';
  });
  check('API secret', function () { if (!secret) throw new Error('API_SECRET missing — run setup()'); return 'set'; });
  check('Website content API', function () {
    var c = call('content');
    return c.services.length + ' services, ' + c.projects.length + ' projects, company "' + c.settings.companyName + '"';
  });
  check('Create lead (+ private upload)', function () {
    var r = call('lead', {
      name: 'SELF TEST — delete me', phone: '+919999999999', requirement: 'Self Test', city: 'Test',
      submissionId: 'selftest-' + Utilities.getUuid(), attribution: { source: 'Website', utmCampaign: 'selftest' },
      uploads: [{ field: 'floorPlan', mimeType: 'application/pdf', base64: Utilities.base64Encode('%PDF-1.4 self test') }],
    });
    leadId = r.leadId;
    var lead = call('admin/leads').filter(function (l) { return l.leadId === leadId; })[0];
    if (!lead) throw new Error('lead row not found');
    fileUrl = lead.fileUrl;
    return leadId + ' saved, upload stored' + (prop_('NOTIFY_EMAIL') ? ', alert emailed to ' + prop_('NOTIFY_EMAIL') : ' (set NOTIFY_EMAIL for email alerts)');
  });
  check('Update lead status', function () {
    var u = call('admin/lead-update', { leadId: leadId, actor: 'selfTest', update: { status: 'Contacted', remarks: 'self test' } });
    if (u.status !== 'Contacted') throw new Error('status not updated');
    return 'New → Contacted';
  });
  check('Track WhatsApp click', function () {
    call('event', { eventType: 'whatsapp_click', page: '/selftest', label: 'selftest', attribution: { utmCampaign: 'selftest' } });
    return 'EVENTS row written';
  });
  check('Clean up test data', function () {
    deleteRowById_('LEADS', 'Lead ID', leadId);
    deleteRowById_('EVENTS', 'Label', 'selftest');
    var m = String(fileUrl).match(/[-\w]{25,}/);
    if (m) DriveApp.getFileById(m[0]).setTrashed(true);
    return 'removed';
  });

  var failed = results.filter(function (r) { return r.indexOf('FAIL') === 0; }).length;
  var report = results.join('\n') + '\n\n' + (failed ? failed + ' check(s) FAILED' : 'ALL CHECKS PASSED ✔');
  console.log(report);
  return report;
}


// ════════════════ Code.gs ════════════════

/**
 * VBays Interiors — Google Apps Script API (Website ⇄ Google Sheets).
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me   ·   Who has access: Anyone
 * Access is controlled by the API_SECRET Script Property: every data request
 * is a POST whose JSON body carries the secret. The website server holds the
 * secret in a server-only env var — it is never exposed to browsers.
 *
 * Script Properties (Project Settings → Script Properties):
 *   API_SECRET            (required) long random string, same as APPS_SCRIPT_SECRET on the website
 *   DRIVE_FOLDER_ID       (optional) overrides DEFAULT_DRIVE_FOLDER_ID (Setup.gs) — where the sheet, uploads & backups live
 *   SPREADSHEET_ID        (auto)     set by setup() when it creates the spreadsheet in the Drive folder
 *   UPLOAD_FOLDER_ID      (auto)     private "Lead Uploads" subfolder, created by setup()
 *   NOTIFY_EMAIL          (optional) comma-separated emails for new-lead alerts & follow-up digest
 *   WEBSITE_URL           (optional) e.g. https://www.example.com — for "Refresh website" after edits
 *   REVALIDATE_SECRET     (optional) same as REVALIDATE_SECRET on the website
 *   META_ACCESS_TOKEN     (optional) long-lived token with instagram_content_publish / pages_manage_posts
 *   IG_USER_ID            (optional) Instagram professional account ID
 *   FB_PAGE_ID            (optional) Facebook Page ID
 *   FB_PAGE_TOKEN         (optional) Page access token (falls back to META_ACCESS_TOKEN)
 *   GRAPH_VERSION         (optional) default v23.0
 */

var TZ = 'Asia/Kolkata';
var PUBLIC_ROUTES = ['content', 'settings', 'services', 'projects', 'gallery', 'beforeafter', 'testimonials', 'factory', 'instagram'];

// ─── HTTP entry points ─────────────────────────────────────────────────────

function doGet(e) {
  // Public, read-only CMS content (active rows only). No private data.
  var route = (e && e.parameter && e.parameter.route) || '';
  if (!route) return json_({ ok: true, service: 'website-api', time: now_().iso });
  if (PUBLIC_ROUTES.indexOf(route) === -1) return json_({ ok: false, error: 'Not found', code: 'NOT_FOUND' });
  try {
    return json_({ ok: true, data: publicRoute_(route, e.parameter || {}) });
  } catch (err) {
    return json_({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Invalid JSON', code: 'BAD_REQUEST' });
  }
  var secret = prop_('API_SECRET');
  if (!secret) return json_({ ok: false, error: 'API_SECRET not configured', code: 'NOT_CONFIGURED' });
  if (!safeEqual_(String(body.secret || ''), secret)) return json_({ ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });

  var route = String(body.route || '');
  var data = body.data || {};
  try {
    var handler = ROUTES[route];
    if (handler) return json_({ ok: true, data: handler(data) });
    if (PUBLIC_ROUTES.indexOf(route) !== -1) return json_({ ok: true, data: publicRoute_(route, data) });
    return json_({ ok: false, error: 'Unknown route', code: 'NOT_FOUND' });
  } catch (err) {
    console.error(route + ': ' + (err && err.stack || err));
    return json_({ ok: false, error: String(err && err.message || err), code: err && err.code || 'SERVER_ERROR' });
  }
}

var ROUTES = {
  'lead': function (d) { return createLead_(d, 'lead'); },
  'contact': function (d) { return createLead_(d, 'contact'); },
  'event': logEvent_,
  'whatsapp-event': logEvent_,
  'social-post': function (d) { return saveSocialPost_(d.post || d); },
  'admin/leads': function () { return readObjects_('LEADS'); },
  'admin/lead-update': updateLead_,
  'admin/event-summary': eventSummary_,
  'admin/social': function () { return readObjects_('SOCIAL_POSTS'); },
  'admin/social-delete': function (d) { deleteRowById_('SOCIAL_POSTS', 'Post ID', d.postId); return true; },
  'admin/social-publish': function (d) { return publishPostById_(d.postId); },
  'admin/calendar': function () { return readObjects_('CONTENT_CALENDAR'); },
  'admin/calendar-save': saveCalendar_,
  'admin/campaigns': function () { return recomputeCampaigns(); },
  'admin/campaign-save': function (d) { return saveCampaign_(d.campaign || d); },
};

function publicRoute_(route, params) {
  switch (route) {
    case 'content':
      return {
        settings: readSettings_(),
        services: activeRows_('SERVICES'),
        projects: activeRows_('PROJECTS'),
        gallery: activeRows_('GALLERY'),
        beforeAfter: activeRows_('BEFORE_AFTER'),
        testimonials: activeRows_('TESTIMONIALS', true),
        factory: activeRows_('FACTORY'),
      };
    case 'settings': return readSettings_();
    case 'services': return activeRows_('SERVICES');
    case 'projects': return activeRows_('PROJECTS');
    case 'gallery': return activeRows_('GALLERY');
    case 'beforeafter': return activeRows_('BEFORE_AFTER');
    case 'testimonials': return activeRows_('TESTIMONIALS', true);
    case 'factory': return activeRows_('FACTORY');
    case 'instagram': return instagramFeed_(Number(params.limit) || 8);
  }
  return null;
}

// ─── Sheet helpers ─────────────────────────────────────────────────────────

var ss__ = null;
/** The website spreadsheet: created by setup() inside the Drive folder (standalone script),
 *  or the container spreadsheet if this script is bound to a sheet. */
function ss_() {
  if (ss__) return ss__;
  var id = prop_('SPREADSHEET_ID');
  ss__ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss__) throw withCode_(new Error('Spreadsheet not created yet — run setup()'), 'NOT_CONFIGURED');
  return ss__;
}

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw withCode_(new Error('Missing sheet ' + name + ' — run setup()'), 'NOT_CONFIGURED');
  return sh;
}

function camel_(h) {
  return String(h).split(/[^A-Za-z0-9]+/).filter(String).map(function (w, i) {
    return i ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase();
  }).join('');
}

function headers_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
}

/** All rows as camelCase objects (display values, so dates/phones stay as typed). */
function readObjects_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(1, 1, last, sh.getLastColumn()).getDisplayValues();
  var keys = values[0].map(camel_);
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.join('') === '') continue;
    var o = {};
    for (var c = 0; c < keys.length; c++) if (keys[c]) o[keys[c]] = row[c];
    out.push(o);
  }
  return out;
}

function isTrue_(v, dflt) {
  var s = String(v === undefined ? '' : v).trim().toLowerCase();
  if (!s) return dflt;
  return ['true', 'yes', 'y', '1', 'active', 'on'].indexOf(s) !== -1;
}

/** Active rows only. Testimonials default to hidden until explicitly approved. */
function activeRows_(name, strict) {
  return readObjects_(name).filter(function (o) { return isTrue_(o.active, !strict); });
}

function readSettings_() {
  var sh = sheet_('SETTINGS');
  var values = sh.getDataRange().getDisplayValues();
  var out = {};
  for (var i = 1; i < values.length; i++) {
    var label = String(values[i][0]).trim();
    if (!label) continue;
    var key = SETTINGS_KEYS[label] || camel_(label);
    out[key] = values[i][1];
  }
  return out;
}

/** Prevents spreadsheet formula injection from user-supplied text. */
function safe_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s.length > 45000 ? s.slice(0, 45000) : s;
}

function appendObject_(name, obj) {
  var sh = sheet_(name);
  var hs = headers_(sh);
  var row = hs.map(function (h) { return safe_(obj[camel_(h)]); });
  sh.appendRow(row);
  return sh.getLastRow();
}

function findRow_(sh, header, id) {
  var hs = headers_(sh);
  var col = hs.indexOf(header) + 1;
  if (!col || !id) return 0;
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, col, last - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === String(id)) return i + 2;
  return 0;
}

function rowObject_(sh, rowNum) {
  var hs = headers_(sh);
  var vals = sh.getRange(rowNum, 1, 1, hs.length).getDisplayValues()[0];
  var o = {};
  hs.forEach(function (h, i) { o[camel_(h)] = vals[i]; });
  return o;
}

/** Updates only the given camelCase fields on a row. */
function updateRow_(sh, rowNum, fields) {
  var hs = headers_(sh);
  var range = sh.getRange(rowNum, 1, 1, hs.length);
  var vals = range.getValues()[0];
  hs.forEach(function (h, i) {
    var k = camel_(h);
    if (Object.prototype.hasOwnProperty.call(fields, k) && fields[k] !== undefined) vals[i] = safe_(fields[k]);
  });
  range.setValues([vals]);
  return rowObject_(sh, rowNum);
}

function deleteRowById_(name, header, id) {
  var sh = sheet_(name);
  var r = findRow_(sh, header, id);
  if (r) sh.deleteRow(r);
}

// ─── Time / IDs ────────────────────────────────────────────────────────────

function now_() {
  var d = new Date();
  return {
    date: Utilities.formatDate(d, TZ, 'yyyy-MM-dd'),
    time: Utilities.formatDate(d, TZ, 'HH:mm:ss'),
    compact: Utilities.formatDate(d, TZ, 'yyMMdd'),
    iso: d.toISOString(),
  };
}

function nextSeq_(prefix, width) {
  var n = now_();
  var props = PropertiesService.getScriptProperties();
  var key = 'seq_' + prefix + n.compact;
  var v = Number(props.getProperty(key) || '0') + 1;
  props.setProperty(key, String(v));
  var s = String(v);
  while (s.length < width) s = '0' + s;
  return prefix + n.compact + '-' + s;
}

// ─── Leads ─────────────────────────────────────────────────────────────────

var ALLOWED_UPLOADS = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
var MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function createLead_(d, formType) {
  if (!d.name || !d.phone) throw withCode_(new Error('Missing name or phone'), 'BAD_REQUEST');
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var sh = sheet_('LEADS');
    var dup = findDuplicate_(sh, d);
    if (dup) return { leadId: dup, duplicate: true };

    var n = now_();
    var leadId = nextSeq_('VB', 4);
    var a = d.attribution || {};
    var fileUrls = saveUploads_(leadId, d.uploads || []);
    var lead = {
      leadId: leadId, date: n.date, time: n.time,
      name: d.name, phone: d.phone, whatsapp: d.whatsapp || d.phone, email: d.email, city: d.city,
      propertyType: d.propertyType, requirement: d.requirement, budget: d.budget, propertyStatus: d.propertyStatus,
      preferredContact: d.preferredContact, message: d.message, fileUrl: fileUrls.join('\n'),
      source: a.source || 'Website', campaign: a.campaign || a.utmCampaign || '',
      utmSource: a.utmSource, utmMedium: a.utmMedium, utmCampaign: a.utmCampaign, utmContent: a.utmContent,
      status: 'New', assignedTo: '', followUpDate: '', lastContactDate: '',
      remarks: formType === 'contact' ? 'Contact page enquiry' : '',
      createdAt: n.iso, updatedAt: n.iso,
      formType: formType, landingPage: a.landingPage, referrer: a.referrer, submissionId: d.submissionId,
    };
    appendObject_('LEADS', lead);
    SpreadsheetApp.flush();
    notifyNewLead_(lead);
    return { leadId: leadId, duplicate: false };
  } finally {
    lock.releaseLock();
  }
}

/** Same submission ID, or same phone + requirement within 10 minutes. */
function findDuplicate_(sh, d) {
  var last = sh.getLastRow();
  if (last < 2) return '';
  var start = Math.max(2, last - 300);
  var values = sh.getRange(start, 1, last - start + 1, sh.getLastColumn()).getDisplayValues();
  var hs = headers_(sh);
  var iId = hs.indexOf('Lead ID'), iSub = hs.indexOf('Submission ID'), iPhone = hs.indexOf('Phone'),
      iReq = hs.indexOf('Requirement'), iCreated = hs.indexOf('Created At');
  var cutoff = Date.now() - 10 * 60 * 1000;
  for (var i = values.length - 1; i >= 0; i--) {
    var r = values[i];
    if (d.submissionId && r[iSub] === d.submissionId) return r[iId];
    if (r[iPhone] === d.phone && r[iReq] === (d.requirement || '') && new Date(r[iCreated]).getTime() > cutoff) return r[iId];
  }
  return '';
}

function uploadFolder_() {
  var id = prop_('UPLOAD_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  var folder = subfolder_('Lead Uploads (private)');
  PropertiesService.getScriptProperties().setProperty('UPLOAD_FOLDER_ID', folder.getId());
  return folder;
}

/** Re-validates type & size server-side and stores files in a PRIVATE Drive folder. */
function saveUploads_(leadId, uploads) {
  if (!uploads || !uploads.length) return [];
  var folder = uploadFolder_();
  return uploads.slice(0, 3).map(function (u) {
    var ext = ALLOWED_UPLOADS[u.mimeType];
    if (!ext) throw withCode_(new Error('Unsupported file type'), 'BAD_REQUEST');
    var bytes = Utilities.base64Decode(String(u.base64 || ''));
    if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw withCode_(new Error('File too large'), 'BAD_REQUEST');
    var field = String(u.field || 'file').replace(/[^A-Za-z]/g, '').slice(0, 20);
    var file = folder.createFile(Utilities.newBlob(bytes, u.mimeType, leadId + '-' + field + '.' + ext));
    file.setDescription('Lead ' + leadId);
    makePrivate_(file);
    // Files inherit the folder's (private) sharing — never shared publicly.
    return file.getUrl();
  });
}

function notifyNewLead_(lead) {
  var to = prop_('NOTIFY_EMAIL');
  if (!to) return;
  try {
    var lines = [
      'New ' + (lead.formType === 'contact' ? 'contact enquiry' : 'lead') + ': ' + lead.leadId,
      '', 'Name: ' + lead.name, 'Phone: ' + lead.phone, 'WhatsApp: ' + lead.whatsapp, 'Email: ' + (lead.email || '—'),
      'City: ' + (lead.city || '—'), 'Requirement: ' + (lead.requirement || '—'), 'Property: ' + [lead.propertyType, lead.propertyStatus].filter(String).join(' · '),
      'Budget: ' + (lead.budget || '—'), 'Source: ' + lead.source + (lead.utmCampaign ? ' / ' + lead.utmCampaign : ''),
      'Files: ' + (lead.fileUrl ? 'yes (see sheet)' : 'none'), '', 'Message:', lead.message || '—',
      '', 'Open the sheet: ' + ss_().getUrl(),
    ];
    MailApp.sendEmail(to, 'New interior lead ' + lead.leadId + ' — ' + lead.name + ' (' + (lead.requirement || 'enquiry') + ')', lines.join('\n'));
  } catch (err) {
    console.error('notify failed: ' + err);
  }
}

var LEAD_STATUSES = ['New', 'Contacted', 'Follow-up', 'Site Visit', 'Design', 'Quotation', 'Negotiation', 'Confirmed', 'Completed', 'Lost'];

function updateLead_(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_('LEADS');
    var r = findRow_(sh, 'Lead ID', d.leadId);
    if (!r) throw withCode_(new Error('Lead not found'), 'NOT_FOUND');
    var u = d.update || {};
    var fields = {};
    if (u.status !== undefined) {
      if (LEAD_STATUSES.indexOf(u.status) === -1) throw withCode_(new Error('Invalid status'), 'BAD_REQUEST');
      fields.status = u.status;
    }
    ['assignedTo', 'followUpDate', 'lastContactDate'].forEach(function (k) { if (u[k] !== undefined) fields[k] = u[k]; });
    if (u.remarks) {
      var n = now_();
      var existing = rowObject_(sh, r).remarks;
      fields.remarks = '[' + n.date + ' ' + n.time.slice(0, 5) + ' · ' + String(d.actor || 'admin') + '] ' + u.remarks + (existing ? '\n' + existing : '');
    }
    fields.updatedAt = now_().iso;
    return updateRow_(sh, r, fields);
  } finally {
    lock.releaseLock();
  }
}

// ─── Events (WhatsApp / call / Instagram / maps clicks) ───────────────────

function logEvent_(d) {
  var n = now_();
  var a = d.attribution || {};
  appendObject_('EVENTS', {
    eventId: 'EV' + n.compact + '-' + Utilities.getUuid().slice(0, 8),
    eventType: d.eventType, page: d.page, service: d.service, label: d.label,
    source: a.source, campaign: a.campaign || a.utmCampaign, utmSource: a.utmSource, utmMedium: a.utmMedium,
    utmCampaign: a.utmCampaign, utmContent: a.utmContent, date: n.date, time: n.time, createdAt: n.iso,
  });
  return true;
}

function eventSummary_() {
  var out = { byType: {}, byCampaign: {}, bySource: {} };
  readObjects_('EVENTS').forEach(function (e) {
    var t = e.eventType;
    out.byType[t] = (out.byType[t] || 0) + 1;
    var c = e.utmCampaign || '(none)';
    out.byCampaign[c] = out.byCampaign[c] || {};
    out.byCampaign[c][t] = (out.byCampaign[c][t] || 0) + 1;
    var s = e.source || 'Direct';
    out.bySource[s] = out.bySource[s] || {};
    out.bySource[s][t] = (out.bySource[s][t] || 0) + 1;
  });
  return out;
}

// ─── Campaigns ─────────────────────────────────────────────────────────────

/** Recomputes factual metrics from LEADS + EVENTS and writes them to CAMPAIGNS. */
function recomputeCampaigns() {
  var sh = sheet_('CAMPAIGNS');
  var leads = readObjects_('LEADS');
  var events = readObjects_('EVENTS');
  var campaigns = readObjects_('CAMPAIGNS');
  campaigns.forEach(function (c) {
    var row = findRow_(sh, 'Campaign ID', c.campaignId);
    var key = c.utmCampaign;
    var ls = key ? leads.filter(function (l) { return l.utmCampaign === key; }) : [];
    var ev = key ? events.filter(function (e) { return e.utmCampaign === key; }) : [];
    c.leads = ls.length;
    c.conversions = ls.filter(function (l) { return l.status === 'Confirmed' || l.status === 'Completed'; }).length;
    c.whatsappClicks = ev.filter(function (e) { return e.eventType === 'whatsapp_click'; }).length;
    c.calls = ev.filter(function (e) { return e.eventType === 'call_click'; }).length;
    if (row) updateRow_(sh, row, { leads: c.leads, conversions: c.conversions, whatsappClicks: c.whatsappClicks, calls: c.calls });
  });
  return campaigns;
}

function saveCampaign_(c) {
  var sh = sheet_('CAMPAIGNS');
  var allowed = ['campaignName', 'platform', 'startDate', 'endDate', 'landingPage', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'status'];
  var fields = {};
  allowed.forEach(function (k) { if (c[k] !== undefined) fields[k] = c[k]; });
  var r = c.campaignId ? findRow_(sh, 'Campaign ID', c.campaignId) : 0;
  if (r) return updateRow_(sh, r, fields);
  fields.campaignId = nextSeq_('CMP', 3);
  fields.leads = 0; fields.whatsappClicks = 0; fields.calls = 0; fields.conversions = 0;
  return rowObject_(sh, appendObject_('CAMPAIGNS', fields));
}

// ─── Content calendar ──────────────────────────────────────────────────────

function saveCalendar_(d) {
  var sh = sheet_('CONTENT_CALENDAR');
  var hs = headers_(sh);
  var entries = (d.entries || []).slice(0, 21);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, hs.length).clearContent();
  if (entries.length) {
    var rows = entries.map(function (e) {
      return hs.map(function (h) {
        var v = e[camel_(h)];
        return typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : safe_(v);
      });
    });
    sh.getRange(2, 1, rows.length, hs.length).setValues(rows);
  }
  return readObjects_('CONTENT_CALENDAR');
}

// ─── Follow-up digest (daily trigger) ──────────────────────────────────────

function sendFollowUpDigest() {
  var to = prop_('NOTIFY_EMAIL');
  if (!to) return;
  var today = now_().date;
  var due = readObjects_('LEADS').filter(function (l) {
    return l.followUpDate && l.followUpDate <= today && ['Completed', 'Lost', 'Confirmed'].indexOf(l.status) === -1;
  });
  var fresh = readObjects_('LEADS').filter(function (l) { return l.status === 'New'; });
  if (!due.length && !fresh.length) return;
  var body = ['Follow-ups due today / overdue: ' + due.length, ''];
  due.forEach(function (l) { body.push('• ' + l.followUpDate + '  ' + l.leadId + '  ' + l.name + '  ' + l.phone + '  [' + l.status + '] ' + (l.assignedTo || 'unassigned')); });
  body.push('', 'Leads still in "New": ' + fresh.length);
  fresh.slice(0, 20).forEach(function (l) { body.push('• ' + l.leadId + '  ' + l.name + '  ' + l.phone + '  ' + (l.requirement || '')); });
  body.push('', ss_().getUrl());
  MailApp.sendEmail(to, 'Lead follow-ups for ' + today + ' (' + due.length + ' due)', body.join('\n'));
}

// ─── Website cache refresh ─────────────────────────────────────────────────

function refreshWebsite() {
  var url = prop_('WEBSITE_URL');
  var secret = prop_('REVALIDATE_SECRET');
  if (!url || !secret) return 'Set WEBSITE_URL and REVALIDATE_SECRET script properties first.';
  var res = UrlFetchApp.fetch(url.replace(/\/$/, '') + '/api/revalidate', {
    method: 'post', headers: { 'x-revalidate-secret': secret }, muteHttpExceptions: true,
  });
  return res.getResponseCode() === 200 ? 'Website refreshed.' : 'Refresh failed (' + res.getResponseCode() + ').';
}

/** Installable on-edit trigger: refresh the website at most once a minute after CMS edits. */
function onSheetEdit(e) {
  var name = e && e.range && e.range.getSheet().getName();
  if (['LEADS', 'EVENTS', 'SOCIAL_POSTS', 'CAMPAIGNS', 'CONTENT_CALENDAR'].indexOf(name) !== -1) return;
  var cache = CacheService.getScriptCache();
  if (cache.get('refresh_pending')) return;
  cache.put('refresh_pending', '1', 60);
  refreshWebsite();
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withCode_(err, code) { err.code = code; return err; }

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}


// ════════════════ Social.gs ════════════════

/**
 * Social media content management & publishing via official APIs only.
 *
 *  Instagram  — Instagram Graph API content publishing (Image, Carousel, Reel/Video, Story)
 *  Facebook   — Pages API (Photo, multi-photo, Video, text)
 *  Others     — YouTube, LinkedIn, Pinterest and unsupported formats are never
 *               "faked": they are marked "Ready to Publish" for manual posting.
 *
 * Flow: Draft → Approved → Scheduled → Publishing → Published (URL saved) | Failed
 * The time-driven trigger processScheduledPosts() runs every 15 minutes.
 * Auto Publish (SETTINGS) = TRUE also publishes *Approved* posts once due.
 */

var SOCIAL_STATUSES = ['Draft', 'Approved', 'Scheduled', 'Publishing', 'Published', 'Ready to Publish', 'Failed'];
var SOCIAL_FIELDS = ['contentType', 'platform', 'caption', 'imageUrl', 'videoUrl', 'hashtags', 'campaignId', 'scheduledDate', 'scheduledTime', 'status'];

function saveSocialPost_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_('SOCIAL_POSTS');
    var fields = {};
    SOCIAL_FIELDS.forEach(function (k) { if (p[k] !== undefined) fields[k] = p[k]; });
    if (fields.status && SOCIAL_STATUSES.indexOf(fields.status) === -1) throw withCode_(new Error('Invalid status'), 'BAD_REQUEST');
    fields.updatedAt = now_().iso;
    var r = p.postId ? findRow_(sh, 'Post ID', p.postId) : 0;
    if (r) {
      var merged = rowObject_(sh, r);
      Object.keys(fields).forEach(function (k) { merged[k] = fields[k]; });
      if (merged.status === 'Scheduled' && (!merged.scheduledDate || !merged.scheduledTime)) {
        throw withCode_(new Error('Scheduled posts need a date and time'), 'BAD_REQUEST');
      }
      if (fields.status && fields.status !== 'Failed') fields.errorMessage = '';
      return updateRow_(sh, r, fields);
    }
    fields.postId = nextSeq_('SP', 3);
    fields.status = fields.status || 'Draft';
    fields.createdAt = fields.updatedAt;
    return rowObject_(sh, appendObject_('SOCIAL_POSTS', fields));
  } finally {
    lock.releaseLock();
  }
}

function publishPostById_(postId) {
  var sh = sheet_('SOCIAL_POSTS');
  var r = findRow_(sh, 'Post ID', postId);
  if (!r) throw withCode_(new Error('Post not found'), 'NOT_FOUND');
  var post = rowObject_(sh, r);
  if (post.status === 'Draft') throw withCode_(new Error('Approve the post before publishing'), 'BAD_REQUEST');
  return publishRow_(sh, r, post);
}

/** Time-driven trigger (every 15 min): publishes due posts and finalises video containers. */
function processScheduledPosts() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var sh = sheet_('SOCIAL_POSTS');
    var auto = isTrue_(readSettings_().autoPublish, false);
    var nowStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
    var posts = readObjects_('SOCIAL_POSTS');
    posts.forEach(function (p) {
      var row = findRow_(sh, 'Post ID', p.postId);
      if (!row) return;
      if (p.status === 'Publishing' && p.containerId) return finaliseContainer_(sh, row, p);
      var eligible = p.status === 'Scheduled' || (auto && p.status === 'Approved');
      if (!eligible || !p.scheduledDate || !p.scheduledTime) return;
      if ((p.scheduledDate + ' ' + p.scheduledTime.slice(0, 5)) > nowStr) return;
      publishRow_(sh, row, p);
    });
  } finally {
    lock.releaseLock();
  }
}

function publishRow_(sh, row, p) {
  var caption = [p.caption, p.hashtags].filter(String).join('\n\n');
  updateRow_(sh, row, { status: 'Publishing', errorMessage: '', updatedAt: now_().iso });
  try {
    var result;
    if (p.platform === 'Instagram') result = publishInstagram_(p, caption);
    else if (p.platform === 'Facebook') result = publishFacebook_(p, caption);
    else result = { ready: 'Automatic publishing to ' + p.platform + ' is not enabled via an official API in this system. Post manually and paste the URL.' };

    if (result.ready) return updateRow_(sh, row, { status: 'Ready to Publish', errorMessage: result.ready, updatedAt: now_().iso });
    if (result.pendingContainer) return updateRow_(sh, row, { status: 'Publishing', containerId: result.pendingContainer, errorMessage: 'Video processing — will publish automatically.', updatedAt: now_().iso });
    return updateRow_(sh, row, { status: 'Published', publishedUrl: result.url || '', containerId: '', errorMessage: '', updatedAt: now_().iso });
  } catch (err) {
    return updateRow_(sh, row, { status: 'Failed', errorMessage: String(err.message || err).slice(0, 500), updatedAt: now_().iso });
  }
}

// ─── Graph API helpers ─────────────────────────────────────────────────────

function graph_(method, path, params, token) {
  var base = 'https://graph.facebook.com/' + (prop_('GRAPH_VERSION') || 'v23.0') + '/';
  var opts = { method: method, muteHttpExceptions: true };
  var p = params || {};
  p.access_token = token;
  var url = base + path;
  if (method === 'get') {
    url += '?' + Object.keys(p).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
  } else {
    opts.payload = p;
  }
  var res = UrlFetchApp.fetch(url, opts);
  var body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) { /* ignore */ }
  if (res.getResponseCode() >= 400 || body.error) {
    throw new Error('Graph API: ' + ((body.error && body.error.message) || ('HTTP ' + res.getResponseCode())));
  }
  return body;
}

function mediaUrls_(p) {
  return String(p.imageUrl || '').split(/\n|\|/).map(function (s) { return s.trim(); }).filter(function (s) { return /^https:\/\//.test(s); });
}

// ─── Instagram ─────────────────────────────────────────────────────────────

function publishInstagram_(p, caption) {
  var ig = prop_('IG_USER_ID');
  var token = prop_('META_ACCESS_TOKEN');
  if (!ig || !token) return { ready: 'Instagram API not connected (set IG_USER_ID and META_ACCESS_TOKEN). Ready for manual posting.' };
  var images = mediaUrls_(p);
  var type = p.contentType;
  var container;

  if (type === 'Carousel') {
    if (images.length < 2) throw new Error('Carousel needs 2–10 image URLs (one per line).');
    var children = images.slice(0, 10).map(function (u) { return graph_('post', ig + '/media', { image_url: u, is_carousel_item: 'true' }, token).id; });
    container = graph_('post', ig + '/media', { media_type: 'CAROUSEL', children: children.join(','), caption: caption }, token).id;
  } else if (type === 'Reel' || type === 'Video') {
    if (!p.videoUrl) throw new Error('Reel/Video needs a public Video URL.');
    container = graph_('post', ig + '/media', { media_type: 'REELS', video_url: p.videoUrl, caption: caption, share_to_feed: 'true' }, token).id;
  } else if (type === 'Story') {
    var sp = p.videoUrl ? { media_type: 'STORIES', video_url: p.videoUrl } : { media_type: 'STORIES', image_url: images[0] };
    if (!p.videoUrl && !images[0]) throw new Error('Story needs an image or video URL.');
    container = graph_('post', ig + '/media', sp, token).id;
  } else {
    if (!images[0]) throw new Error('Image post needs a public https Image URL.');
    container = graph_('post', ig + '/media', { image_url: images[0], caption: caption }, token).id;
  }

  if (!waitForContainer_(container, token, type === 'Reel' || type === 'Video' || (type === 'Story' && p.videoUrl) ? 45 : 10)) {
    return { pendingContainer: container };
  }
  return { url: publishContainer_(ig, container, token) };
}

function waitForContainer_(id, token, seconds) {
  var until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    var s = graph_('get', id, { fields: 'status_code' }, token).status_code;
    if (s === 'FINISHED' || !s) return true;
    if (s === 'ERROR' || s === 'EXPIRED') throw new Error('Instagram could not process the media (' + s + ').');
    Utilities.sleep(5000);
  }
  return false;
}

function publishContainer_(ig, container, token) {
  var mediaId = graph_('post', ig + '/media_publish', { creation_id: container }, token).id;
  try {
    return graph_('get', mediaId, { fields: 'permalink' }, token).permalink || '';
  } catch (e) {
    return '';
  }
}

function finaliseContainer_(sh, row, p) {
  var ig = prop_('IG_USER_ID');
  var token = prop_('META_ACCESS_TOKEN');
  try {
    if (!waitForContainer_(p.containerId, token, 5)) return;
    var url = publishContainer_(ig, p.containerId, token);
    updateRow_(sh, row, { status: 'Published', publishedUrl: url, containerId: '', errorMessage: '', updatedAt: now_().iso });
  } catch (err) {
    updateRow_(sh, row, { status: 'Failed', errorMessage: String(err.message || err).slice(0, 500), updatedAt: now_().iso });
  }
}

/** Latest media for the website's Instagram section (cached 1 hour). */
function instagramFeed_(limit) {
  var ig = prop_('IG_USER_ID');
  var token = prop_('META_ACCESS_TOKEN');
  if (!ig || !token) return [];
  var cache = CacheService.getScriptCache();
  var hit = cache.get('ig_feed');
  if (hit) return JSON.parse(hit);
  try {
    var res = graph_('get', ig + '/media', { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: Math.min(limit || 8, 12) }, token);
    var items = (res.data || []).map(function (m) {
      return { id: m.id, caption: m.caption || '', mediaType: m.media_type, mediaUrl: m.media_url || '', thumbnailUrl: m.thumbnail_url || m.media_url || '', permalink: m.permalink, timestamp: m.timestamp };
    });
    cache.put('ig_feed', JSON.stringify(items), 3600);
    return items;
  } catch (err) {
    console.error('instagram feed: ' + err);
    return [];
  }
}

// ─── Facebook Page ─────────────────────────────────────────────────────────

function publishFacebook_(p, caption) {
  var page = prop_('FB_PAGE_ID');
  var token = prop_('FB_PAGE_TOKEN') || prop_('META_ACCESS_TOKEN');
  if (!page || !token) return { ready: 'Facebook Page API not connected (set FB_PAGE_ID and FB_PAGE_TOKEN). Ready for manual posting.' };
  var images = mediaUrls_(p);
  var type = p.contentType;

  if (type === 'Reel' || type === 'Story') return { ready: 'Facebook ' + type + 's are not auto-published by this system. Post manually from Meta Business Suite.' };
  if (type === 'Video') {
    if (!p.videoUrl) throw new Error('Video post needs a public Video URL.');
    var v = graph_('post', page + '/videos', { file_url: p.videoUrl, description: caption }, token);
    return { url: 'https://www.facebook.com/' + v.id };
  }
  if (type === 'Carousel' && images.length > 1) {
    var params = { message: caption };
    images.slice(0, 10).forEach(function (u, i) {
      var id = graph_('post', page + '/photos', { url: u, published: 'false' }, token).id;
      params['attached_media[' + i + ']'] = JSON.stringify({ media_fbid: id });
    });
    var post = graph_('post', page + '/feed', params, token);
    return { url: 'https://www.facebook.com/' + post.id };
  }
  if (images[0]) {
    var photo = graph_('post', page + '/photos', { url: images[0], caption: caption }, token);
    return { url: 'https://www.facebook.com/' + (photo.post_id || photo.id) };
  }
  var text = graph_('post', page + '/feed', { message: caption }, token);
  return { url: 'https://www.facebook.com/' + text.id };
}


// ════════════════ Schema.gs ════════════════

// AUTO-GENERATED by scripts/gen-apps-script.ts — do not edit by hand.
// Sheet structure (headers) and first-run seed content.

var SCHEMA = {
  "SETTINGS": [
    "Setting",
    "Value",
    "Notes"
  ],
  "SERVICES": [
    "Service ID",
    "Service Name",
    "Category",
    "Slug",
    "Short Description",
    "Full Description",
    "Main Image",
    "Gallery Images",
    "Starting Price",
    "SEO Title",
    "SEO Description",
    "H1",
    "Image Alt",
    "Benefits",
    "Materials",
    "Design Examples",
    "FAQs",
    "Featured",
    "Display Order",
    "WhatsApp Message",
    "Active"
  ],
  "PROJECTS": [
    "Project ID",
    "Project Name",
    "Slug",
    "Location",
    "Category",
    "Service Slug",
    "Description",
    "Project Date",
    "Area",
    "Budget Range",
    "Cover Image",
    "Gallery Images",
    "Featured",
    "Display Order",
    "Active"
  ],
  "GALLERY": [
    "Image ID",
    "Project ID",
    "Category",
    "Image URL",
    "Title",
    "Description",
    "Display Order",
    "Active"
  ],
  "BEFORE_AFTER": [
    "ID",
    "Project Name",
    "Description",
    "Location",
    "Category",
    "Before Image",
    "After Image",
    "Display Order",
    "Active"
  ],
  "TESTIMONIALS": [
    "Testimonial ID",
    "Customer Name",
    "Location",
    "Project Type",
    "Review",
    "Rating",
    "Photo",
    "Display Order",
    "Active"
  ],
  "FACTORY": [
    "ID",
    "Type",
    "Title",
    "Description",
    "Image URL",
    "Display Order",
    "Active"
  ],
  "LEADS": [
    "Lead ID",
    "Date",
    "Time",
    "Name",
    "Phone",
    "WhatsApp",
    "Email",
    "City",
    "Property Type",
    "Requirement",
    "Budget",
    "Property Status",
    "Preferred Contact",
    "Message",
    "File URL",
    "Source",
    "Campaign",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "UTM Content",
    "Status",
    "Assigned To",
    "Follow Up Date",
    "Last Contact Date",
    "Remarks",
    "Created At",
    "Updated At",
    "Form Type",
    "Landing Page",
    "Referrer",
    "Submission ID"
  ],
  "EVENTS": [
    "Event ID",
    "Event Type",
    "Page",
    "Service",
    "Label",
    "Source",
    "Campaign",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "UTM Content",
    "Date",
    "Time",
    "Created At"
  ],
  "SOCIAL_POSTS": [
    "Post ID",
    "Content Type",
    "Platform",
    "Caption",
    "Image URL",
    "Video URL",
    "Hashtags",
    "Campaign ID",
    "Scheduled Date",
    "Scheduled Time",
    "Status",
    "Published URL",
    "Error Message",
    "Created At",
    "Updated At",
    "Container ID"
  ],
  "CONTENT_CALENDAR": [
    "Day",
    "Category",
    "Service Slug",
    "Content Type",
    "Platform",
    "Time",
    "Active"
  ],
  "CAMPAIGNS": [
    "Campaign ID",
    "Campaign Name",
    "Platform",
    "Start Date",
    "End Date",
    "Landing Page",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "UTM Content",
    "Leads",
    "WhatsApp Clicks",
    "Calls",
    "Conversions",
    "Status"
  ]
};

var SETTINGS_KEYS = {
  "Company Name": "companyName",
  "Logo URL": "logoUrl",
  "Phone": "phone",
  "WhatsApp Number": "whatsappNumber",
  "Email": "email",
  "Office Address": "officeAddress",
  "Factory Address": "factoryAddress",
  "Google Maps URL": "googleMapsUrl",
  "Factory Maps URL": "factoryMapsUrl",
  "Google Business Profile URL": "googleBusinessProfileUrl",
  "Google Review URL": "googleReviewUrl",
  "Instagram URL": "instagramUrl",
  "Instagram Handle": "instagramHandle",
  "Facebook URL": "facebookUrl",
  "YouTube URL": "youtubeUrl",
  "Working Hours": "workingHours",
  "WhatsApp Default Message": "whatsappDefaultMessage",
  "Footer Text": "footerText",
  "Primary CTA": "primaryCta",
  "Secondary CTA": "secondaryCta",
  "Default City": "defaultCity",
  "Service Areas": "serviceAreas",
  "Staff Members": "staffMembers",
  "Hero Image": "heroImage",
  "Factory Hero Image": "factoryHeroImage",
  "About Image": "aboutImage",
  "Years Experience": "yearsExperience",
  "Projects Completed": "projectsCompleted",
  "Factory Area": "factoryArea",
  "Auto Publish": "autoPublish"
};

var SEED = {
  "SETTINGS": [
    [
      "Company Name",
      "VBays Interiors",
      ""
    ],
    [
      "Logo URL",
      "",
      "Public image URL (PNG/SVG). Leave blank to use the text logo."
    ],
    [
      "Phone",
      "+91 90000 00000",
      "Shown on the site and used for click-to-call"
    ],
    [
      "WhatsApp Number",
      "919000000000",
      "Country code + number, digits only, e.g. 919876543210"
    ],
    [
      "Email",
      "hello@vbaysinteriors.com",
      ""
    ],
    [
      "Office Address",
      "Design Studio, Main Road, Visakhapatnam, Andhra Pradesh",
      ""
    ],
    [
      "Factory Address",
      "Modular Manufacturing Unit, Industrial Estate, Visakhapatnam, Andhra Pradesh",
      ""
    ],
    [
      "Google Maps URL",
      "",
      "Office directions link (optional)"
    ],
    [
      "Factory Maps URL",
      "",
      "Factory directions link (optional)"
    ],
    [
      "Google Business Profile URL",
      "",
      "Used for 'See Our Google Reviews'"
    ],
    [
      "Google Review URL",
      "",
      "Direct 'write a review' link"
    ],
    [
      "Instagram URL",
      "https://www.instagram.com/",
      ""
    ],
    [
      "Instagram Handle",
      "vbaysinteriors",
      "Without @"
    ],
    [
      "Facebook URL",
      "",
      ""
    ],
    [
      "YouTube URL",
      "",
      ""
    ],
    [
      "Working Hours",
      "Mon – Sat: 9:30 AM – 7:00 PM · Sunday by appointment",
      ""
    ],
    [
      "WhatsApp Default Message",
      "Hello, I am interested in your interior design services. I would like to discuss my project.",
      ""
    ],
    [
      "Footer Text",
      "Complete modular interiors — designed by our studio, manufactured in our own factory and installed by our team.",
      ""
    ],
    [
      "Primary CTA",
      "Get Free Consultation",
      ""
    ],
    [
      "Secondary CTA",
      "Chat on WhatsApp",
      ""
    ],
    [
      "Default City",
      "Visakhapatnam",
      "Replaces {city} in SEO fields"
    ],
    [
      "Service Areas",
      "Visakhapatnam, Vizianagaram, Anakapalli, Srikakulam, Rajahmundry",
      "Comma separated. Each gets local SEO pages."
    ],
    [
      "Staff Members",
      "Sales Team, Designer 1, Designer 2, Site Supervisor",
      "Comma separated. Used for lead assignment."
    ],
    [
      "Hero Image",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=75",
      "Home page hero image URL"
    ],
    [
      "Factory Hero Image",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=75",
      ""
    ],
    [
      "About Image",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75",
      ""
    ],
    [
      "Years Experience",
      "",
      "Optional. Only shown if filled."
    ],
    [
      "Projects Completed",
      "",
      "Optional. Only shown if filled."
    ],
    [
      "Factory Area",
      "",
      "Optional, e.g. 20,000 sq.ft"
    ],
    [
      "Auto Publish",
      "FALSE",
      "TRUE = approved posts with a date/time publish automatically"
    ]
  ],
  "SERVICES": [
    [
      "SRV-001",
      "Full Home Interiors",
      "Full Home",
      "full-home-interiors",
      "One team for your entire home — planning, 3D design, factory-made modular furniture and installation.",
      "Our full home interiors bring every room together under a single design language. We plan the space, visualise it in 3D, manufacture modular units in our own factory and install everything with one coordinated schedule — so you deal with one team from first meeting to final handover.",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=75",
      "",
      "Full Home Interiors in {city} | Design + Factory + Installation",
      "End-to-end full home interiors in {city}: space planning, 3D design, in-house modular manufacturing and installation by one team.",
      "Full Home Interiors in {city}",
      "Full home interior with modular furniture",
      "Single point of contact for the entire home\nConsistent design language across every room\nFactory-made modular units for precise fit and finish\nCoordinated manufacturing and installation schedule",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "2BHK apartment\n3BHK apartment\nIndependent villa\nRenovation of existing home",
      "What is included in full home interiors? :: Typically the kitchen, wardrobes, TV unit, pooja unit, storage, false ceiling coordination and loose furniture planning. The exact scope is finalised during consultation.\nDo you manufacture the furniture yourselves? :: Yes. Modular units are manufactured in our own factory, which lets us control quality and schedule.\nCan I do a few rooms first and the rest later? :: Yes. We can plan the complete home and execute in phases.",
      "TRUE",
      "1",
      "Hello, I am interested in Full Home Interiors. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-002",
      "Modular Kitchen",
      "Kitchen",
      "modular-kitchen",
      "L-shaped, U-shaped, parallel and island kitchens — made to measure in our factory.",
      "A modular kitchen should work as hard as you do. We design around your cooking habits, appliances and storage needs, then manufacture every carcass and shutter in our factory for a precise, durable fit.",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=75",
      "",
      "Modular Kitchen in {city} | Factory-Made, Custom Designed",
      "Custom modular kitchens in {city} designed in 3D and manufactured in our own factory. L-shaped, U-shaped, parallel and island layouts.",
      "Modular Kitchen Designers in {city}",
      "Modern modular kitchen with handleless cabinets",
      "Ergonomic work-triangle planning\nMoisture-resistant materials for wet areas\nTall units, corner solutions & smart accessories\nPrecise factory manufacturing",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "L-shaped kitchen\nU-shaped kitchen\nParallel kitchen\nIsland kitchen\nStraight kitchen",
      "Which material is best for a modular kitchen? :: For carcasses we usually recommend BWP-grade plywood near the sink and water areas. Shutter finishes depend on budget and look — laminate, acrylic or PU.\nHow long does a modular kitchen take? :: After design approval, manufacturing and installation usually take a few weeks, depending on the finish and scope.",
      "TRUE",
      "2",
      "Hello, I am interested in Modular Kitchen Interior Design. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-003",
      "Bedroom Interiors",
      "Bedroom",
      "bedroom-interiors",
      "Calm, functional bedrooms with wardrobes, beds, side units and dressing areas.",
      "We design bedrooms that balance rest and storage — wardrobes, beds with storage, study corners and dressing units — all built to your room's exact measurements.",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=75",
      "",
      "Bedroom Interiors in {city} | Wardrobes, Beds & Storage",
      "Bedroom interior design in {city} with factory-made wardrobes, storage beds and dressing units.",
      "Bedroom Interior Design in {city}",
      "Bedroom interior with upholstered bed and wardrobe",
      "Maximised storage\nCustom headboards & panelling\nIntegrated lighting\nMade-to-measure fit",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "Master bedroom\nGuest bedroom\nParents' bedroom",
      "",
      "TRUE",
      "3",
      "Hello, I am interested in Bedroom Interiors. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-004",
      "Living Room Interiors",
      "Living Room",
      "living-room",
      "Welcoming living spaces with TV units, panelling, storage and lighting design.",
      "Your living room sets the tone for the entire home. We plan furniture layout, feature walls, TV units, display and storage with a lighting plan that works day and night.",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75",
      "",
      "Living Room Interiors in {city} | TV Units, Panelling & Storage",
      "Living room interior design in {city}: feature walls, TV units, display storage and lighting.",
      "Living Room Interior Design in {city}",
      "Living room with sofa, feature wall and warm lighting",
      "Feature walls & panelling\nBalanced furniture layout\nDisplay & concealed storage\nLayered lighting",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "TRUE",
      "4",
      "Hello, I am interested in Living Room Interiors. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-005",
      "Wardrobes",
      "Wardrobe",
      "wardrobes",
      "Sliding, hinged and walk-in wardrobes with smart internal planning.",
      "Wardrobes are planned from the inside out — hanging, drawers, lofts, lockers and accessories — then manufactured in our factory with the finish of your choice.",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=75",
      "",
      "Modular Wardrobes in {city} | Sliding, Hinged & Walk-in",
      "Custom modular wardrobes in {city} — sliding, hinged and walk-in, manufactured in our own factory.",
      "Modular Wardrobes in {city}",
      "Floor-to-ceiling modular wardrobe",
      "Internal layout planned to your needs\nLoft storage\nSoft-close hardware\nMirror & glass options",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "Sliding wardrobe\nHinged wardrobe\nWalk-in wardrobe\nWardrobe with dresser",
      "",
      "TRUE",
      "5",
      "Hello, I am interested in Modular Wardrobes. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-006",
      "TV Units",
      "TV Unit",
      "tv-units",
      "Wall-mounted and floor TV units with concealed wiring and display storage.",
      "TV units designed as a feature — with concealed wiring, back panelling, display shelves and closed storage sized to your wall.",
      "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75",
      "",
      "TV Unit Design in {city} | Modular TV Units",
      "Custom modular TV units in {city} with panelling, concealed wiring and storage.",
      "TV Unit Design in {city}",
      "Wall-mounted TV unit with panelling",
      "Concealed wiring\nFeature panelling\nOpen + closed storage",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "FALSE",
      "6",
      "Hello, I am interested in a TV Unit. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-007",
      "Pooja Units",
      "Pooja Unit",
      "pooja-units",
      "Serene pooja units and mandirs with jaali, backlighting and storage.",
      "Pooja units designed with care — CNC jaali work, backlit panels, bell provisions and storage for essentials, sized for walls, corners or dedicated rooms.",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=75",
      "",
      "",
      "Pooja Unit Design in {city} | Modular Mandir",
      "Custom pooja units in {city} with CNC jaali, backlighting and storage.",
      "Pooja Unit Design in {city}",
      "Wooden pooja unit with backlit jaali",
      "CNC jaali designs\nBacklit panels\nDrawer storage",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "FALSE",
      "7",
      "Hello, I am interested in a Pooja Unit. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-008",
      "Kids Bedroom",
      "Bedroom",
      "kids-bedroom",
      "Playful, safe and grow-with-me kids rooms with study and storage.",
      "Kids rooms that adapt as your children grow — rounded edges, study tables, bunk or storage beds and plenty of toy and book storage.",
      "https://images.unsplash.com/photo-1617104551722-3b2d51366400?auto=format&fit=crop&w=1600&q=75",
      "",
      "",
      "Kids Bedroom Interiors in {city}",
      "Kids bedroom interior design in {city} with study units, storage beds and safe finishes.",
      "Kids Bedroom Interiors in {city}",
      "Kids bedroom with study table and storage",
      "",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "FALSE",
      "8",
      "Hello, I am interested in a Kids Bedroom design. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-009",
      "Home Office",
      "Office",
      "home-office",
      "Focused work-from-home setups with ergonomic desks and storage.",
      "Home offices designed for long working hours — ergonomic desk heights, cable management, shelving and good task lighting.",
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1600&q=75",
      "",
      "",
      "Home Office Interiors in {city}",
      "Home office and study unit design in {city}.",
      "Home Office Interiors in {city}",
      "Home office desk with shelving",
      "",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "FALSE",
      "9",
      "Hello, I am interested in a Home Office design. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-010",
      "Office Interiors",
      "Office",
      "office-interiors",
      "Workstations, cabins, reception and meeting rooms built for productivity.",
      "Office interiors that reflect your brand and help teams work better — workstations, cabins, conference rooms, reception and storage, manufactured in our factory and installed with minimal disruption.",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=75",
      "",
      "Office Interiors in {city} | Workstations, Cabins & Reception",
      "Office interior design and modular office furniture manufacturing in {city}.",
      "Office Interior Designers in {city}",
      "Modern office interior with workstations",
      "Modular workstations\nBrand-aligned design\nPhased execution",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "TRUE",
      "10",
      "Hello, I am interested in Office Interiors. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-011",
      "Commercial Interiors",
      "Commercial",
      "commercial-interiors",
      "Retail, clinics, cafés and showrooms designed to attract and convert.",
      "Commercial spaces designed around customer flow and brand — retail fixtures, counters, display systems and back-of-house storage, all manufactured in-house.",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=75",
      "",
      "",
      "Commercial Interiors in {city} | Retail, Clinics & Cafés",
      "Commercial interior design and custom fixture manufacturing in {city}.",
      "Commercial Interior Design in {city}",
      "Commercial café interior",
      "",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "FALSE",
      "11",
      "Hello, I am interested in Commercial Interiors. Please contact me for a consultation.",
      "TRUE"
    ],
    [
      "SRV-012",
      "Custom Modular Furniture",
      "Modular",
      "custom-modular-furniture",
      "Made-to-measure storage, study, utility and loft units from our factory.",
      "When standard furniture doesn't fit, we build it. Storage units, lofts, study units, shoe racks, utility cabinets and more — manufactured to your exact measurements.",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=75",
      "",
      "",
      "Custom Modular Furniture in {city} | Factory-Made",
      "Custom modular furniture manufactured in our own factory in {city}.",
      "Custom Modular Furniture in {city}",
      "Custom modular storage unit",
      "",
      "BWP / BWR grade plywood\nPre-laminated particle board & MDF (where suitable)\nHigh-pressure laminates, acrylic & PU finishes\nSoft-close hinges and channels\nBranded hardware & accessories",
      "",
      "",
      "FALSE",
      "12",
      "Hello, I am interested in Custom Modular Furniture. Please contact me for a consultation.",
      "TRUE"
    ]
  ],
  "PROJECTS": [
    [
      "PRJ-001",
      "3BHK Apartment — Warm Contemporary",
      "3bhk-warm-contemporary",
      "Visakhapatnam",
      "Full Home",
      "full-home-interiors",
      "Complete interiors for a 3BHK apartment: modular kitchen, three wardrobes, TV unit, pooja unit and storage — manufactured in our factory.",
      "2026-06",
      "1,650 sq.ft",
      "",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=75",
      "TRUE",
      "1",
      "TRUE"
    ],
    [
      "PRJ-002",
      "Handleless L-Shaped Kitchen",
      "handleless-l-shaped-kitchen",
      "Visakhapatnam",
      "Kitchen",
      "modular-kitchen",
      "Handleless L-shaped kitchen with tall pantry unit and acrylic shutters.",
      "2026-05",
      "",
      "",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=1600&q=75",
      "TRUE",
      "2",
      "TRUE"
    ],
    [
      "PRJ-003",
      "Master Bedroom with Walk-in Wardrobe",
      "master-bedroom-walk-in",
      "Vizianagaram",
      "Bedroom",
      "bedroom-interiors",
      "Master bedroom with panelled headboard wall and a walk-in wardrobe.",
      "2026-04",
      "",
      "",
      "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=75",
      "TRUE",
      "3",
      "TRUE"
    ],
    [
      "PRJ-004",
      "Living Room Feature Wall & TV Unit",
      "living-feature-wall-tv-unit",
      "Anakapalli",
      "Living Room",
      "living-room",
      "Fluted panel feature wall with floating TV unit and concealed storage.",
      "2026-03",
      "",
      "",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1600&q=75",
      "TRUE",
      "4",
      "TRUE"
    ],
    [
      "PRJ-005",
      "Corporate Office — 40 Seats",
      "corporate-office-40-seats",
      "Visakhapatnam",
      "Office",
      "office-interiors",
      "Workstations, two cabins, meeting room and reception built in our factory.",
      "2026-02",
      "3,200 sq.ft",
      "",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=75\nhttps://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=75",
      "TRUE",
      "5",
      "TRUE"
    ],
    [
      "PRJ-006",
      "Sliding Wardrobe Series",
      "sliding-wardrobe-series",
      "Srikakulam",
      "Wardrobe",
      "wardrobes",
      "Three sliding wardrobes with lofts and internal drawers.",
      "2026-01",
      "",
      "",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=75",
      "FALSE",
      "6",
      "TRUE"
    ],
    [
      "PRJ-007",
      "Café Fit-out",
      "cafe-fit-out",
      "Visakhapatnam",
      "Commercial",
      "commercial-interiors",
      "Service counter, back bar and seating fixtures manufactured in-house.",
      "2025-12",
      "",
      "",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=75",
      "FALSE",
      "7",
      "TRUE"
    ],
    [
      "PRJ-008",
      "Floating TV Unit",
      "floating-tv-unit",
      "Rajahmundry",
      "TV Unit",
      "tv-units",
      "Floating TV unit with backlit panel.",
      "2025-11",
      "",
      "",
      "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1600&q=75",
      "FALSE",
      "8",
      "TRUE"
    ]
  ],
  "GALLERY": [
    [
      "IMG-001",
      "PRJ-002",
      "Kitchen",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=75",
      "L-shaped kitchen",
      "",
      "1",
      "TRUE"
    ],
    [
      "IMG-002",
      "",
      "Kitchen",
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=1600&q=75",
      "Island kitchen",
      "",
      "2",
      "TRUE"
    ],
    [
      "IMG-003",
      "PRJ-003",
      "Bedroom",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=75",
      "Master bedroom",
      "",
      "3",
      "TRUE"
    ],
    [
      "IMG-004",
      "",
      "Living Room",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75",
      "Open living & dining",
      "",
      "4",
      "TRUE"
    ],
    [
      "IMG-005",
      "PRJ-003",
      "Wardrobe",
      "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=75",
      "Walk-in wardrobe",
      "",
      "5",
      "TRUE"
    ],
    [
      "IMG-006",
      "PRJ-008",
      "TV Unit",
      "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1600&q=75",
      "Floating TV unit",
      "",
      "6",
      "TRUE"
    ],
    [
      "IMG-007",
      "PRJ-001",
      "Full Home",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=75",
      "3BHK living room",
      "",
      "7",
      "TRUE"
    ],
    [
      "IMG-008",
      "PRJ-005",
      "Office",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=75",
      "Meeting room",
      "",
      "8",
      "TRUE"
    ],
    [
      "IMG-009",
      "PRJ-007",
      "Commercial",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=75",
      "Café counter",
      "",
      "9",
      "TRUE"
    ],
    [
      "IMG-010",
      "",
      "Factory",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=75",
      "Panel processing",
      "",
      "10",
      "TRUE"
    ],
    [
      "IMG-011",
      "",
      "Factory",
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=75",
      "Assembly line",
      "",
      "11",
      "TRUE"
    ],
    [
      "IMG-012",
      "",
      "Factory",
      "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1600&q=75",
      "Machinery",
      "",
      "12",
      "TRUE"
    ]
  ],
  "BEFORE_AFTER": [
    [
      "BA-001",
      "Kitchen Renovation",
      "A dated kitchen transformed into a bright, storage-rich modular kitchen.",
      "Visakhapatnam",
      "Kitchen",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=75",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1600&q=75",
      "1",
      "TRUE"
    ]
  ],
  "TESTIMONIALS": [
    [
      "TST-001",
      "Sample Customer",
      "Visakhapatnam",
      "Full Home Interiors",
      "Replace this with a real, approved customer review from the TESTIMONIALS sheet and set Active to TRUE.",
      "5",
      "",
      "1",
      "FALSE"
    ]
  ],
  "FACTORY": [
    [
      "FP-01",
      "process",
      "Customer Requirement",
      "We understand your lifestyle, needs and budget.",
      "",
      "1",
      "TRUE"
    ],
    [
      "FP-02",
      "process",
      "Site Measurement",
      "Precise on-site measurements by our team.",
      "",
      "2",
      "TRUE"
    ],
    [
      "FP-03",
      "process",
      "2D Planning",
      "Space planning and furniture layout.",
      "",
      "3",
      "TRUE"
    ],
    [
      "FP-04",
      "process",
      "3D Design",
      "Photo-realistic 3D views of your space.",
      "",
      "4",
      "TRUE"
    ],
    [
      "FP-05",
      "process",
      "Design Approval",
      "You review, refine and approve every detail.",
      "",
      "5",
      "TRUE"
    ],
    [
      "FP-06",
      "process",
      "Material Selection",
      "Boards, laminates, finishes and hardware finalised.",
      "",
      "6",
      "TRUE"
    ],
    [
      "FP-07",
      "process",
      "Production Planning",
      "Cutting lists and production schedule prepared.",
      "",
      "7",
      "TRUE"
    ],
    [
      "FP-08",
      "process",
      "Panel Cutting",
      "Accurate panel sizing on precision saws.",
      "",
      "8",
      "TRUE"
    ],
    [
      "FP-09",
      "process",
      "Edge Banding",
      "Edges sealed for durability and a clean finish.",
      "",
      "9",
      "TRUE"
    ],
    [
      "FP-10",
      "process",
      "Drilling / CNC",
      "Hardware drilling and CNC work where applicable.",
      "",
      "10",
      "TRUE"
    ],
    [
      "FP-11",
      "process",
      "Assembly",
      "Units assembled and dry-fitted in the factory.",
      "",
      "11",
      "TRUE"
    ],
    [
      "FP-12",
      "process",
      "Quality Inspection",
      "Dimensions, finish and hardware checked.",
      "",
      "12",
      "TRUE"
    ],
    [
      "FP-13",
      "process",
      "Packing",
      "Protective packing for safe transport.",
      "",
      "13",
      "TRUE"
    ],
    [
      "FP-14",
      "process",
      "Delivery",
      "Scheduled delivery to your site.",
      "",
      "14",
      "TRUE"
    ],
    [
      "FP-15",
      "process",
      "Installation",
      "Installed by our trained installation team.",
      "",
      "15",
      "TRUE"
    ],
    [
      "FC-01",
      "capability",
      "Cutting",
      "Precision panel cutting for accurate sizes.",
      "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1600&q=75",
      "1",
      "TRUE"
    ],
    [
      "FC-02",
      "capability",
      "Edge Banding",
      "Clean, sealed edges on every panel.",
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=75",
      "2",
      "TRUE"
    ],
    [
      "FC-03",
      "capability",
      "Drilling & CNC",
      "Hardware drilling and CNC work where applicable.",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=75",
      "3",
      "TRUE"
    ],
    [
      "FC-04",
      "capability",
      "Assembly",
      "Units assembled and checked before dispatch.",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=75",
      "4",
      "TRUE"
    ],
    [
      "FC-05",
      "capability",
      "Quality Checking",
      "Dimensional and finish inspection.",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=75",
      "5",
      "TRUE"
    ],
    [
      "FC-06",
      "capability",
      "Packing",
      "Protective packing for safe delivery.",
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=75",
      "6",
      "TRUE"
    ]
  ],
  "CONTENT_CALENDAR": [
    [
      "Monday",
      "Modular Kitchen",
      "modular-kitchen",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ],
    [
      "Tuesday",
      "Bedroom Interior",
      "bedroom-interiors",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ],
    [
      "Wednesday",
      "Factory / Manufacturing",
      "",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ],
    [
      "Thursday",
      "Before & After",
      "",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ],
    [
      "Friday",
      "Completed Project",
      "",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ],
    [
      "Saturday",
      "Interior Tip",
      "",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ],
    [
      "Sunday",
      "Consultation / CTA",
      "",
      "Image",
      "Instagram",
      "18:30",
      "TRUE"
    ]
  ],
  "CAMPAIGNS": [
    [
      "CMP-001",
      "Modular Kitchen — Instagram",
      "Instagram",
      "2026-09-01",
      "2026-09-30",
      "/interiors/modular-kitchen",
      "instagram",
      "social",
      "kitchen_sep26",
      "",
      "0",
      "0",
      "0",
      "0",
      "Active"
    ]
  ]
};
