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
