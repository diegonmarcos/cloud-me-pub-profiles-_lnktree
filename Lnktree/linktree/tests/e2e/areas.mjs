// #1277/#1281 Playwright check of the live Areas + Projects section (mobile 390x844, desktop 1280x800), with screenshots.
//   node tests/e2e/areas.mjs [url] [screenshot-prefix]
// Asserts: order Profiles < Areas < Personal Profiles < xProjects; one icon chip per area; first area selected by default;
// the icon bar AND at least one full project card are inside the viewport together (no vertical scroll between them);
// the cards row scrolls horizontally with snap; tapping a chip swaps the cards and the choice survives a reload;
// private repos carry no link or name.
// Options: PW_CHROMIUM=<browser binary>; HTTPS_PROXY is passed to the browser; E2E_FETCH_VIA_NODE=1 serves every
// request through Node's fetch (TLS verified against the Node CA bundle) for sandboxes whose browser lacks the proxy CA.
import fs from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const data = JSON.parse(fs.readFileSync(new URL("../../src/data/areas.json", import.meta.url), "utf8"));
const url = process.argv[2] || "https://linktree.diegonmarcos.com/";
const shot = process.argv[3] || "";
const proxy = process.env.HTTPS_PROXY && !process.env.E2E_FETCH_VIA_NODE ? { server: process.env.HTTPS_PROXY.replace(/\/\/.*@/, "//") } : undefined;
const browser = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), ...(proxy ? { proxy } : {}) });

async function open(ctx) {
  const page = await ctx.newPage();
  if (process.env.E2E_FETCH_VIA_NODE) await page.route("**/*", async (route) => {
    const req = route.request();
    try {
      const res = await fetch(req.url(), { method: req.method(), headers: req.headers(), body: req.postDataBuffer() || undefined, redirect: "manual" });
      const headers = Object.fromEntries([...res.headers].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k)));
      await route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    } catch { await route.abort(); }
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".areas-section .area-project-card", { timeout: 45000 });
  await page.evaluate(() => document.querySelector(".areas-section").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  return page;
}

const state = (page) => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const inView = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1; };
  const sec = document.querySelector(".areas-section"), bar = sec.querySelector(".areas-row"), row = sec.querySelector(".area-projects__row");
  const cards = [...row.querySelectorAll(".area-project-card")];
  return {
    boxes: [...document.querySelectorAll("main .section-box")].map((b) => b.className + "|" + (b.querySelector(".box-title")?.textContent || "")),
    chips: [...bar.querySelectorAll(".area-chip")].map((c) => ({ field: c.dataset.field, active: c.classList.contains("is-active"), title: c.title })),
    cards: cards.map((c) => ({ name: c.dataset.project, field: c.dataset.field, banner: !!c.querySelector("img.featured-image"), privateLinks: c.querySelectorAll("a.tool-link--private").length })),
    barInView: inView(bar), fullCardInView: cards.some(inView),
    snap: getComputedStyle(row).scrollSnapType,
  };
});

let failed = false;
for (const [label, viewport] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport, isMobile: label === "mobile", hasTouch: label === "mobile" });
  let page = await open(ctx);
  const errs = [];
  let r = await state(page);
  const i = (k) => r.boxes.findIndex((c) => c.includes(k));
  if (!(i("professional-profiles-section") < i("areas-section") && i("areas-section") < i("personal-profiles-section") && i("personal-profiles-section") < i("projects-section"))) errs.push("section order");
  if (!r.boxes[i("projects-section")].endsWith("xPROJECTS")) errs.push("xProjects title");
  if (JSON.stringify(r.chips.map((c) => c.field)) !== JSON.stringify(data.areas.map((a) => a.field))) errs.push("chips != areas");
  if (!r.chips[0]?.active || r.chips.filter((c) => c.active).length !== 1) errs.push("first area not selected by default");
  if (r.chips.some((c) => !c.title)) errs.push("chip tooltip");
  if (JSON.stringify(r.cards.map((c) => c.name)) !== JSON.stringify(data.areas[0].projects.map((p) => p.name))) errs.push("cards != first area");
  if (r.cards.some((c) => !c.banner)) errs.push("card without banner");
  if (r.cards.some((c) => c.privateLinks)) errs.push("private entry carries a link");
  if (!r.barInView || !r.fullCardInView) errs.push(`one screen: bar ${r.barInView}, full card ${r.fullCardInView}`);
  if (!r.snap.startsWith("x")) errs.push("snap");
  if (shot) await page.screenshot({ path: `${shot}-${label}.png` });
  // select another area (the one with most projects), check swap + persistence across reload
  const pick = data.areas.slice(1).sort((a, b) => b.projects.length - a.projects.length)[0];
  if (pick) {
    await page.click(`.area-chip[data-field="${pick.field}"]`);
    await page.waitForTimeout(400);
    r = await state(page);
    if (JSON.stringify(r.cards.map((c) => c.name)) !== JSON.stringify(pick.projects.map((p) => p.name))) errs.push("tap does not swap cards");
    if (shot) await page.screenshot({ path: `${shot}-${label}-${pick.field.replace(/\W+/g, "")}.png` });
    await page.close();
    page = await open(ctx);
    r = await state(page);
    if (!r.chips.find((c) => c.field === pick.field)?.active) errs.push("selection not persisted");
    if (!r.barInView || !r.fullCardInView) errs.push("one screen after reload");
  }
  console.log(label, `${r.chips.length} chips, ${r.cards.length} cards, snap=${r.snap}`, errs.length ? `FAIL ${errs.join("; ")}` : "OK");
  if (errs.length) failed = true;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
