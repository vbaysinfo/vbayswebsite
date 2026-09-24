/**
 * One-time setup & admin menu.
 *   1. Create a new Google Sheet → Extensions → Apps Script.
 *   2. Add Code.gs, Social.gs, Setup.gs, Schema.gs and appsscript.json from this folder.
 *   3. Project Settings → Script Properties → add API_SECRET (and optional properties, see Code.gs).
 *   4. Run setup() once and approve the permissions.
 *   5. Run setupTriggers() once.
 *   6. Deploy → New deployment → Web app (Execute as: Me · Access: Anyone) → copy the URL
 *      into the website's APPS_SCRIPT_URL environment variable.
 */

var TEXT_SHEETS = ['SETTINGS', 'SERVICES', 'PROJECTS', 'GALLERY', 'BEFORE_AFTER', 'TESTIMONIALS', 'FACTORY', 'LEADS', 'EVENTS', 'SOCIAL_POSTS', 'CONTENT_CALENDAR', 'CAMPAIGNS'];
var PRIVATE_SHEETS = ['LEADS', 'EVENTS'];

function setup() {
  var ss = ss_();
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
  return 'Setup complete. API_SECRET is in Project Settings → Script Properties.';
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
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss_()).onEdit().create();
  return 'Triggers installed.';
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Refresh website now', 'menuRefresh_')
    .addItem('Publish due social posts now', 'processScheduledPosts')
    .addItem('Recalculate campaign metrics', 'recomputeCampaigns')
    .addItem('Send follow-up digest now', 'sendFollowUpDigest')
    .addSeparator()
    .addItem('Run setup (safe to re-run)', 'setup')
    .addItem('Install triggers', 'setupTriggers')
    .addToUi();
}

function menuRefresh_() {
  SpreadsheetApp.getActive().toast(refreshWebsite(), 'Website', 5);
}
