// #1140 regression: the link cards must render for the Cloud Browser app's own user agents.
// The strings are NOT typed here: they are read from cloud-u-android ac_cloud-browser/build.json
// (ui.browser.user_agents), the file the app itself reads, so the test follows the app.
//
//   node tests/e2e/cloud-browser-ua.mjs <build.json> [url]     (default https://linktree.diegonmarcos.com/)
//
// Each UA runs the same visible-card check as sections-visible.mjs, with the matching device
// (mobile UA: phone viewport, touch, mobile; desktop UA: desktop viewport). Uncaught page errors
// and failed requests are printed as evidence and an uncaught page error fails the run.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { checkSections } from './sections-visible.mjs';

const [cfgPath, url = 'https://linktree.diegonmarcos.com/'] = process.argv.slice(2);
if (!cfgPath) { console.error('usage: cloud-browser-ua.mjs <build.json> [url]'); process.exit(2); }
const uas = JSON.parse(readFileSync(cfgPath, 'utf8'))?.ui?.browser?.user_agents;
if (!uas || !uas.mobile || !uas.desktop) { console.error('FAIL: build.json has no ui.browser.user_agents.{mobile,desktop}'); process.exit(2); }

const devices = {
  mobile: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 800 } },
};
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
let failed = false;
for (const [kind, device] of Object.entries(devices)) {
  const ctx = await browser.newContext({ ...device, userAgent: uas[kind] });
  const page = await ctx.newPage();
  const errors = [], failedReq = [], consoleErr = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 200)); });
  page.on('requestfailed', r => failedReq.push(r.url() + ' ' + (r.failure() && r.failure().errorText)));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const seenUa = await page.evaluate(() => navigator.userAgent);
  const { report, ok } = await checkSections(page);
  console.log(kind, 'UA', seenUa);
  console.log(kind, JSON.stringify(report));
  if (errors.length) console.log(kind, 'PAGE ERRORS', JSON.stringify(errors));
  if (consoleErr.length) console.log(kind, 'CONSOLE ERRORS', JSON.stringify(consoleErr.slice(0, 10)));
  if (failedReq.length) console.log(kind, 'FAILED REQUESTS', JSON.stringify(failedReq.slice(0, 10)));
  if (seenUa !== uas[kind]) { console.error(`FAIL: ${kind} page saw a different user agent`); failed = true; }
  if (!ok) { console.error(`FAIL: ${kind} UA: a section has no visible card with content`); failed = true; }
  if (errors.length) { console.error(`FAIL: ${kind} UA: uncaught page error`); failed = true; }
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
