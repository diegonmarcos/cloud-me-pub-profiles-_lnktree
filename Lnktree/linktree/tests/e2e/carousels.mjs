// #1293 follow-up: every card section runs on the ONE carousel (src/typescript/modules/carousel.ts). Live Playwright check:
//   node tests/e2e/carousels.mjs [url] [screenshot-prefix]
// For each section (professional, areas, personal, projects), on mobile 390x844 (real touch drags via CDP touch events)
// and desktop 1280x800 (mouse drags, then the next/prev arrows):
//   - the carousel is a Swiper of the same constructor with the same behaviour params as every other section;
//   - each gesture moves exactly ONE card (loop-aware), then settles cleanly: no transition running, exactly one card
//     in view, the active card aligned with the carousel and fully opaque;
//   - the carousel host is never scrolled (scrollLeft 0: no card pushed half off-screen);
//   - dots = cards.
// Screenshots: <prefix>-<viewport>-<section>-before.png / -after.png.
// Options as tests/e2e/areas.mjs (PW_CHROMIUM, HTTPS_PROXY, E2E_FETCH_VIA_NODE=1).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const url = process.argv[2] || "https://linktree.diegonmarcos.com/";
const shot = process.argv[3] || "";
const SECTIONS = ["professional", "areas", "personal", "projects"];
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
  // The loading screen covers the page until the loader finishes; gestures before that would hit the overlay.
  await page.waitForFunction(() => { const l = document.getElementById("loading-screen"); return !l || getComputedStyle(l).display === "none" || !l.classList.contains("active"); }, null, { timeout: 60000 });
  await page.waitForFunction((ids) => ids.every((id) => document.querySelector(`[data-carousel="${id}"]`)?.swiper), SECTIONS, { timeout: 45000 });
  return page;
}

const state = (page, id) => page.evaluate((id) => {
  const host = document.querySelector(`[data-carousel="${id}"]`), sw = host.swiper, hr = host.getBoundingClientRect();
  const p = sw.params;
  const params = JSON.stringify({ effect: p.effect, loop: p.loop, slidesPerView: p.slidesPerView, spaceBetween: p.spaceBetween, speed: p.speed,
    grabCursor: p.grabCursor, touchRatio: p.touchRatio, resistanceRatio: p.resistanceRatio, threshold: p.threshold, longSwipes: p.longSwipes,
    simulateTouch: p.simulateTouch, allowTouchMove: p.allowTouchMove, creativeEffect: p.creativeEffect, keyboard: p.keyboard });
  const slides = [...host.querySelectorAll(".swiper-wrapper > .swiper-slide")];
  const visible = slides.filter((s) => { const r = s.getBoundingClientRect(); return +getComputedStyle(s).opacity > 0.05 && Math.min(r.right, hr.right) - Math.max(r.left, hr.left) > 2; });
  const a = sw.slides[sw.activeIndex], ar = a.getBoundingClientRect();
  return { ctor: sw.constructor.name + "/" + Object.keys(sw.constructor.prototype).length, params, n: slides.length, index: sw.realIndex,
    animating: sw.animating, visible: visible.length, settled: Math.abs(ar.left - hr.left) < 2 && +getComputedStyle(a).opacity > 0.99,
    enabled: sw.enabled && sw.allowTouchMove, hostScroll: host.scrollLeft, dots: host.closest(".carousel-row").querySelectorAll(".swiper-pagination-bullet").length,
    box: { x: hr.x, y: hr.y, w: hr.width, h: hr.height } };
}, id);

const settle = (page, id) => page.waitForFunction((id) => !document.querySelector(`[data-carousel="${id}"]`).swiper.animating, id, { timeout: 5000 })
  .then(() => page.waitForFunction((id) => { const s = document.querySelector(`[data-carousel="${id}"]`).swiper; const a = s.slides[s.activeIndex];
    return Math.abs(a.getBoundingClientRect().left - s.el.getBoundingClientRect().left) < 2 && +getComputedStyle(a).opacity > 0.99; }, id, { timeout: 5000 }).catch(() => {}));

let failed = false;
for (const [label, viewport, touch] of [["mobile", { width: 390, height: 844 }, true], ["desktop", { width: 1280, height: 800 }, false]]) {
  const ctx = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch });
  const page = await open(ctx);
  const cdp = touch ? await ctx.newCDPSession(page) : null;
  const errs = [];
  const seen = {};
  for (const id of SECTIONS) {
    await page.evaluate((id) => document.querySelector(`[data-carousel="${id}"]`).closest(".section-box").scrollIntoView({ block: "start" }), id);
    await settle(page, id);
    let s = await state(page, id);
    seen[id] = s;
    if (s.n < 2) { errs.push(`${id}: ${s.n} cards`); continue; }
    if (!s.enabled) errs.push(`${id}: touch disabled`);
    if (s.dots !== s.n) errs.push(`${id}: ${s.dots} dots for ${s.n} cards`);
    if (shot) await page.screenshot({ path: `${shot}-${label}-${id}-before.png` });
    const y = s.box.y + s.box.h * 0.3, xr = s.box.x + s.box.w * 0.8, xl = s.box.x + s.box.w * 0.2;
    const drag = async (from, to) => {
      if (cdp) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
        for (let k = 1; k <= 6; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from + (to - from) * k / 6, y }] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } else {
        await page.mouse.move(from, y); await page.mouse.down(); await page.mouse.move(to, y, { steps: 6 }); await page.mouse.up();
      }
    };
    const host = `[data-carousel="${id}"]`;
    const steps = [[`${touch ? "touch" : "mouse"} swipe left`, () => drag(xr, xl), 1], [`${touch ? "touch" : "mouse"} swipe right`, () => drag(xl, xr), -1]];
    if (!touch) steps.push(["next arrow", () => page.click(`${host} .swiper-button-next`), 1], ["prev arrow", () => page.click(`${host} .swiper-button-prev`), -1]);
    for (const [what, act, want] of steps) {
      const before = (await state(page, id)).index;
      await act();
      await settle(page, id);
      s = await state(page, id);
      const exp = (before + want + s.n) % s.n;
      if (s.index !== exp) errs.push(`${id} ${what}: card ${before} -> ${s.index}, expected ${exp}`);
      if (s.hostScroll) errs.push(`${id} ${what}: carousel host scrolled ${s.hostScroll}px (card pushed off-screen)`);
      if (s.animating || s.visible !== 1 || !s.settled) errs.push(`${id} ${what}: not settled (animating ${s.animating}, ${s.visible} in view, aligned ${s.settled})`);
      if (shot && what.endsWith("swipe left")) await page.screenshot({ path: `${shot}-${label}-${id}-after.png` });
    }
  }
  const ref = seen.projects;
  for (const id of SECTIONS) if (seen[id] && (seen[id].ctor !== ref.ctor || seen[id].params !== ref.params)) errs.push(`${id}: Swiper type/params differ from xProjects (${seen[id].params})`);
  console.log(label, SECTIONS.map((id) => `${id}:${seen[id]?.n ?? 0}`).join(" "), errs.length ? `FAIL ${errs.join("; ")}` : "OK: every section one card per gesture, same Swiper");
  if (errs.length) failed = true;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
