// Combines the Apps Script sources into ONE file for copy-paste into
// script.google.com → New project → Code.gs.  Run: npm run bundle:apps-script
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";

const dir = new URL("../apps-script/", import.meta.url);
const parts = ["Setup.gs", "Code.gs", "Social.gs", "Schema.gs"];
const header = `/**
 * VBays Interiors — Website API (single-file bundle, generated — edit apps-script/*.gs instead)
 *
 * HOW TO INSTALL (5 minutes):
 *   1. script.google.com → New project → rename it "VBays Interiors API"
 *   2. Select all in Code.gs, delete, and paste THIS WHOLE FILE. Save (Ctrl+S).
 *   3. Project Settings (gear icon) → tick "Show appsscript.json manifest file in editor"
 *      → open appsscript.json → replace it with apps-script/dist/appsscript.json. Save.
 *   4. Function dropdown → setup → Run → Review permissions → choose your account → Allow.
 *      The log shows the new spreadsheet link (created in your Drive folder).
 *   5. Function dropdown → setupTriggers → Run.
 *   6. Deploy → New deployment → gear → Web app → Execute as: Me, Who has access: Anyone
 *      → Deploy → copy the Web app URL.
 *   7. Project Settings → Script Properties → copy API_SECRET.
 *   Put the URL and secret into the website env vars APPS_SCRIPT_URL / APPS_SCRIPT_SECRET.
 */
`;
const body = parts.map((f) => `\n// ════════════════ ${f} ════════════════\n\n` + readFileSync(new URL(f, dir), "utf8")).join("\n");
mkdirSync(new URL("dist/", dir), { recursive: true });
writeFileSync(new URL("dist/Code.gs", dir), header + body);
copyFileSync(new URL("appsscript.json", dir), new URL("dist/appsscript.json", dir));
console.log("apps-script/dist/Code.gs + appsscript.json written");
