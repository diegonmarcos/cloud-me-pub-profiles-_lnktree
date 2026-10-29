// #1277 Playwright check of the live Areas section (mobile + desktop), with screenshots.
//   node tests/e2e/areas.mjs [url] [screenshot-prefix]
// Asserts: Areas box sits between Profiles and Projects, renders one card per project in src/data/areas.json,
// one chip per area, the row scrolls horizontally with snap, and private-only cards carry no link.
import fs from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const data = JSON.parse(fs.readFileSync(new URL("../../src/data/areas.json", import.meta.url), "utf8"));
const url = process.argv[2] || "https://linktree.diegonmarcos.com/";
const shot = process.argv[3] || "";
const want = data.areas.flatMap((a) => a.projects.map((p) => p.name));
// Optional: PW_CHROMIUM=<browser binary>, and the HTTPS_PROXY env is passed to the browser when set.
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY.replace(/\/\/.*@/, "//") } : undefined;
const browser = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), ...(proxy ? { proxy } : {}) });
let failed = false;
for (const [label, viewport] of [["mobile", { width: 412, height: 915 }], ["desktop", { width: 1280, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport, isMobile: label === "mobile", hasTouch: label === "mobile" });
  const page = await ctx.newPage();
  // E2E_FETCH_VIA_NODE=1: serve every request through Node's fetch (TLS verified against the Node CA bundle),
  // for sandboxes whose browser trust store lacks the egress proxy CA.
  if (process.env.E2E_FETCH_VIA_NODE) await page.route("**/*", async (route) => {
    const req = route.request();
    try {
      const res = await fetch(req.url(), { method: req.method(), headers: req.headers(), body: req.postDataBuffer() || undefined, redirect: "manual" });
      const headers = Object.fromEntries([...res.headers].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k)));
      await route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    } catch { await route.abort(); }
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".areas-row .area-card", { timeout: 45000 });
  const r = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll("main .section-box")].map((b) => b.className);
    const row = document.querySelector(".areas-row");
    const cs = getComputedStyle(row);
    return {
      boxes,
      cards: [...row.querySelectorAll(".area-card")].map((c) => ({ name: c.dataset.project, link: !!c.querySelector("a[href]"), w: c.getBoundingClientRect().width })),
      chips: row.querySelectorAll(".area-chip").length,
      snap: cs.scrollSnapType, overflowX: cs.overflowX, scrollable: row.scrollWidth > row.clientWidth,
    };
  });
  const i = (k) => r.boxes.findIndex((c) => c.includes(k));
  const errs = [];
  if (!(i("professional-profiles-section") < i("areas-section") && i("areas-section") < i("projects-section"))) errs.push("order");
  if (JSON.stringify(r.cards.map((c) => c.name)) !== JSON.stringify(want)) errs.push("cards != areas.json");
  if (r.chips !== data.areas.length) errs.push("chips");
  if (!r.snap.startsWith("x")) errs.push("snap");
  if (!r.scrollable) errs.push("not scrollable");
  if (r.cards.some((c) => c.w <= 0)) errs.push("invisible card");
  const priv = new Set(data.areas.flatMap((a) => a.projects.filter((p) => p.private_only).map((p) => p.name)));
  if (r.cards.some((c) => priv.has(c.name) === c.link)) errs.push("link/private mismatch");
  console.log(label, `${r.cards.length} cards, ${r.chips} chips, snap=${r.snap}`, errs.length ? `FAIL ${errs}` : "OK");
  if (errs.length) failed = true;
  if (shot) {
    await page.locator(".areas-section").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${shot}-${label}.png` });
  }
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
