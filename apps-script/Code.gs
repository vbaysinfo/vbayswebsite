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
 *   UPLOAD_FOLDER_ID      (optional) private Drive folder for floor plans; auto-created if blank
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

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

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
  var folder = DriveApp.createFolder('Website Lead Uploads (private)');
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
