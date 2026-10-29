// #1277/#1281/#1293 Playwright check of the live Areas section (mobile 390x844, desktop 1280x800), with screenshots.
//   node tests/e2e/areas.mjs [url] [screenshot-prefix]
// Asserts: order Profiles < Areas < Personal Profiles < xProjects; two-level index (row 1 one chip per area, row 2 the
// selected area's projects), first area and first project selected by default; cards = home card first, then one card per
// sub-category/family exactly as in areas.json (Cloud-Me: home, Pub, Pvt); exactly ONE card per view (full row width,
// snap, the next arrow moves one card); index + one full card inside the viewport together; Cloudy Android lists the
// fleet apps; private repos carry no link; selection persists across reload.
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
  await page.waitForSelector(".areas-section .area-card", { timeout: 45000 });
  await page.evaluate(() => document.querySelector(".areas-section").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  return page;
}

const state = (page) => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const inView = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1; };
  const sec = document.querySelector(".areas-section");
  const areaRow = sec.querySelector("[data-areas-row]"), projRow = sec.querySelector("[data-projects-row]"), row = sec.querySelector("[data-area-cards]");
  const rr = row.getBoundingClientRect();
  const cards = [...row.querySelectorAll(".area-card")];
  const visible = cards.filter((c) => { const r = c.getBoundingClientRect(); return Math.min(r.right, rr.right) - Math.max(r.left, rr.left) > 2; });
  const chips = (bar, k) => [...bar.querySelectorAll(".area-chip")].map((c) => ({ key: c.dataset[k], active: c.classList.contains("is-active"), title: c.title }));
  return {
    boxes: [...document.querySelectorAll("main .section-box")].map((b) => b.className + "|" + (b.querySelector(".box-title")?.textContent || "")),
    areas: chips(areaRow, "field"), projects: chips(projRow, "project"),
    cards: cards.map((c) => ({ kind: c.dataset.kind, name: c.dataset.card, project: c.dataset.project, field: c.dataset.field,
      banner: !!c.querySelector("img.featured-image"), apps: [...c.querySelectorAll("[data-app]")].map((a) => a.dataset.app),
      privateLinks: c.querySelectorAll("a.tool-link--private").length, width: Math.round(c.getBoundingClientRect().width) })),
    rowWidth: Math.round(rr.width), visible: visible.map((c) => c.dataset.card), scrollLeft: Math.round(row.scrollLeft),
    indexInView: inView(areaRow) && inView(projRow), fullCardInView: visible.length === 1 && inView(visible[0]),
    snap: getComputedStyle(row).scrollSnapType,
  };
});

const expectCards = (field, project) => {
  const p = data.areas.find((a) => a.field === field).projects.find((x) => x.name === project);
  return [`home:${p.name}`, ...p.cards.map((c) => `${c.kind}:${c.name}`)];
};
const gotCards = (r) => r.cards.map((c) => `${c.kind}:${c.name}`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function check(r, field, project, errs, tag) {
  const area = data.areas.find((a) => a.field === field);
  if (!same(r.areas.map((c) => c.key), data.areas.map((a) => a.field))) errs.push(`${tag}: area chips != areas`);
  if (r.areas.filter((c) => c.active).map((c) => c.key).join() !== field) errs.push(`${tag}: active area != ${field}`);
  if (!same(r.projects.map((c) => c.key), area.projects.map((p) => p.name))) errs.push(`${tag}: project chips != ${field} projects`);
  if (r.projects.filter((c) => c.active).map((c) => c.key).join() !== project) errs.push(`${tag}: active project != ${project}`);
  if (r.areas.some((c) => !c.title) || r.projects.some((c) => !c.title)) errs.push(`${tag}: chip tooltip`);
  if (!same(gotCards(r), expectCards(field, project))) errs.push(`${tag}: cards ${gotCards(r).join(",")} != data`);
  if (r.cards[0]?.kind !== "home" || !r.cards[0].banner) errs.push(`${tag}: home card first with banner`);
  if (r.cards.some((c) => Math.abs(c.width - r.rowWidth) > 2)) errs.push(`${tag}: card width != row width`);
  if (r.visible.length !== 1) errs.push(`${tag}: ${r.visible.length} cards in view`);
  if (r.cards.some((c) => c.privateLinks)) errs.push(`${tag}: private entry carries a link`);
  if (!r.indexInView || !r.fullCardInView) errs.push(`${tag}: one screen: index ${r.indexInView}, full card ${r.fullCardInView}`);
  if (!r.snap.startsWith("x")) errs.push(`${tag}: snap`);
}

let failed = false;
for (const [label, viewport] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport, isMobile: label === "mobile", hasTouch: label === "mobile" });
  let page = await open(ctx);
  const errs = [];
  let r = await state(page);
  const i = (k) => r.boxes.findIndex((c) => c.includes(k));
  if (!(i("professional-profiles-section") < i("areas-section") && i("areas-section") < i("personal-profiles-section") && i("personal-profiles-section") < i("projects-section"))) errs.push("section order");
  if (!r.boxes[i("projects-section")].endsWith("xPROJECTS")) errs.push("xProjects title");
  const a0 = data.areas[0];
  check(r, a0.field, a0.projects[0].name, errs, "default");
  if (shot) await page.screenshot({ path: `${shot}-${label}.png` });
  // next arrow: exactly one card further, still one in view
  await page.click("[data-cards-next]");
  await page.waitForTimeout(900);
  let n = await state(page);
  if (n.visible.length !== 1 || n.visible[0] !== n.cards[1]?.name) errs.push(`next arrow: in view ${n.visible.join(",")}`);
  // Unix -> Cloudy: Android card lists the fleet apps
  await page.click('[data-areas-row] .area-chip[data-field="Unix"]');
  await page.click('[data-projects-row] .area-chip[data-project="Cloudy"]');
  await page.waitForTimeout(500);
  r = await state(page);
  check(r, "Unix", "Cloudy", errs, "Unix/Cloudy");
  const apps = data.areas.find((a) => a.field === "Unix").projects.find((p) => p.name === "Cloudy").cards.find((c) => c.name === "Android").repos.flatMap((x) => x.apps || []).map((x) => x.name);
  if (!apps.length || !same(r.cards.find((c) => c.name === "Android")?.apps, apps)) errs.push("Cloudy Android apps != manifest");
  if (shot) await page.screenshot({ path: `${shot}-${label}-unix-cloudy.png` });
  // Unix -> Cloud-Me: home, Pub, Pvt; persisted across reload
  await page.click('[data-projects-row] .area-chip[data-project="Cloud-Me"]');
  await page.waitForTimeout(500);
  r = await state(page);
  check(r, "Unix", "Cloud-Me", errs, "Unix/Cloud-Me");
  if (!same(gotCards(r), ["home:Cloud-Me", "subcategory:Pub", "subcategory:Pvt"])) errs.push("Cloud-Me Pub/Pvt split");
  const pick = data.areas.slice(1).sort((a, b) => b.projects.length - a.projects.length)[0];
  await page.click(`[data-areas-row] .area-chip[data-field="${pick.field}"]`);
  const pp = pick.projects[pick.projects.length - 1].name;
  await page.click(`[data-projects-row] .area-chip[data-project="${pp}"]`);
  await page.waitForTimeout(400);
  await page.close();
  page = await open(ctx);
  r = await state(page);
  check(r, pick.field, pp, errs, "after reload");
  console.log(label, `${r.areas.length} areas, ${r.projects.length} projects, ${r.cards.length} cards, ${r.visible.length} in view, snap=${r.snap}`, errs.length ? `FAIL ${errs.join("; ")}` : "OK");
  if (errs.length) failed = true;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
