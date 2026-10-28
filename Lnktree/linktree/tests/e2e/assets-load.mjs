// Every asset loads, every time. Guards the 2026-10-17 regression where random
// icons rendered as broken "?" (edge rate limiter 429'd a single page load).
//
//   node tests/e2e/assets-load.mjs [url]   (default https://linktree.diegonmarcos.com/)
//
// 5 full loads in fresh contexts (cold cache) + a reload storm (10 rapid
// reloads in one context, warm cache + service worker). Fails when any
// same-origin request for an icon/image ends non-2xx/304, or any <img> on
// the page has naturalWidth 0 after the page settles.
import { chromium } from 'playwright';

const URL_ = process.argv[2] || 'https://linktree.diegonmarcos.com/';
const ORIGIN = new URL(URL_).origin;
const ASSET = /\.(svg|png|jpe?g|gif|webp|avif|ico)(\?|$)/i;
const errors = [];
let assetCount = 0;

function watch(page, label) {
  page.on('response', (r) => {
    const u = r.url();
    // Image loads only: the loader's network speed probe is a fetch() of a
    // .jpg with ?t= that it aborts on purpose (modules/loader.ts).
    if (!u.startsWith(ORIGIN) || !ASSET.test(u) || r.request().resourceType() !== 'image') return;
    assetCount++;
    const s = r.status();
    if (!(s >= 200 && s < 300) && s !== 304) errors.push(`${label}: ${s} ${u}`);
  });
  page.on('requestfailed', (q) => {
    const u = q.url();
    if (u.startsWith(ORIGIN) && ASSET.test(u) && q.resourceType() === 'image') errors.push(`${label}: failed ${q.failure()?.errorText} ${u}`);
  });
}

async function brokenImgs(page, label) {
  await page.waitForLoadState('load');
  // Lazy images only load in view: scroll the whole page once.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(4000);
  const bad = await page.evaluate(() => [...document.images]
    .filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0)
    .map(i => i.currentSrc || i.src));
  for (const b of bad) errors.push(`${label}: <img> naturalWidth=0 ${b}`);
  return (await page.evaluate(() => document.images.length));
}

const browser = await chromium.launch();
try {
  for (let i = 1; i <= 5; i++) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true });
    const page = await ctx.newPage();
    watch(page, `load${i}`);
    await page.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 });
    const n = await brokenImgs(page, `load${i}`);
    console.log(`load ${i}: ${n} <img>, ${errors.length} errors so far`);
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true });
  const page = await ctx.newPage();
  watch(page, 'storm');
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 });
  for (let i = 0; i < 10; i++) await page.reload({ waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'load', timeout: 60000 });
  const n = await brokenImgs(page, 'storm');
  console.log(`reload storm: ${n} <img> after 11 reloads`);
  await ctx.close();
} finally {
  await browser.close();
}
console.log(`asset responses checked: ${assetCount}`);
if (errors.length) {
  console.error(`FAIL: ${errors.length} asset problems\n` + [...new Set(errors)].slice(0, 60).join('\n'));
  process.exit(1);
}
console.log('PASS: every icon/image returned 2xx/304 and every <img> rendered');
