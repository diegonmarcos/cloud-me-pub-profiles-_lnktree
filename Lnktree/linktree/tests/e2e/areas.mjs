// #1277/#1281/#1293 Playwright check of the live Areas section (mobile 390x844, desktop 1280x800), with screenshots.
//   node tests/e2e/areas.mjs [url] [screenshot-prefix]
// Asserts: order Profiles < Areas < Personal Profiles < xProjects; two-level index (row 1 one chip per area, row 2 the
// selected area's projects), first area and first project selected by default; cards = home card first, then one card per
// sub-category/family exactly as in areas.json (Cloud-Me: home, Pub, Pvt); every card is an xProjects tools card (#1308); exactly ONE card per view (full row width,
// snap, the next arrow moves one card); index + one full card inside the viewport together; Cloudy Android lists the
// fleet apps; private repos carry no link; selection persists across reload.
// Shared component (#1293 follow-up): Areas runs on the same Swiper as xProjects (same instance type and params) with
// the same card classes and the same card width; screenshots include an xProjects card for side-by-side comparison.
// Swipe gestures for every section: tests/e2e/carousels.mjs.
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
  // The loading screen covers the page until the loader finishes; gestures before that would hit the overlay.
  await page.waitForFunction(() => { const l = document.getElementById("loading-screen"); return !l || getComputedStyle(l).display === "none" || !l.classList.contains("active"); }, null, { timeout: 60000 });
  await page.waitForSelector(".areas-section .swiper-slide .link-section", { state: "attached", timeout: 45000 });
  await page.waitForFunction(() => document.querySelector(".areas-swiper")?.swiper && document.querySelector(".projects-swiper")?.swiper, null, { timeout: 30000 });
  await page.evaluate(() => document.querySelector(".areas-section").scrollIntoView({ block: "start" }));
  await page.waitForFunction(() => !document.querySelector(".areas-swiper").swiper.animating);
  return page;
}

// Bring the Areas box to the top and wait until the page's vertical scroll-snap and the carousel have both settled.
const align = (page) => page.evaluate(() => document.querySelector(".areas-section").scrollIntoView({ block: "start" }))
  .then(() => page.waitForFunction(() => Math.abs(document.querySelector(".areas-section").getBoundingClientRect().top) < 2
    && (() => { const s = document.querySelector(".areas-swiper").swiper, a = s.slides[s.activeIndex];
      return !s.animating && Math.abs(a.querySelector(".link-section").getBoundingClientRect().left - s.el.getBoundingClientRect().left) < 20
        && +getComputedStyle(a).opacity > 0.99; })(), null, { timeout: 10000 }))
  // the active card's banner (lazy) has actually loaded and decoded: no black box in a screenshot
  .then(() => page.waitForFunction(() => { const s = document.querySelector(".areas-swiper").swiper, i = s.slides[s.activeIndex].querySelector("img.featured-image");
    return !i || (i.complete && i.naturalWidth > 0); }, null, { timeout: 20000 }).catch(() => {}))
  .catch(async (e) => { throw new Error("Areas did not settle: " + await page.evaluate(() => { const s = document.querySelector(".areas-swiper").swiper;
    const before = `scroll host ${s.el.scrollLeft} wrap ${s.wrapperEl.scrollLeft} row ${s.el.parentElement.scrollLeft} sec ${s.el.closest(".section-box").scrollLeft} focus ${document.activeElement?.tagName}.${document.activeElement?.className} size ${s.size} width ${Math.round(s.el.clientWidth)} grid ${s.slidesSizesGrid.slice(0, 3).map(Math.round)}`;
    return before + ` | top ${Math.round(document.querySelector(".areas-section").getBoundingClientRect().top)} active ${s.activeIndex} anim ${s.animating} host ${Math.round(s.el.getBoundingClientRect().left)} ` +
      s.slides.map((x, i) => `${i}:${Math.round(x.querySelector(".link-section").getBoundingClientRect().left)}/${(+getComputedStyle(x).opacity).toFixed(2)}`).join(" "); })); });
const state = (page) => align(page).then(() => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const inView = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1; };
  const sec = document.querySelector(".areas-section");
  const areaRow = sec.querySelector("[data-areas-row]"), projRow = sec.querySelector("[data-projects-row]");
  const host = sec.querySelector(".areas-swiper"), sw = host.swiper, xp = document.querySelector(".projects-swiper").swiper;
  const hr = host.getBoundingClientRect();
  const slides = [...host.querySelectorAll(".swiper-wrapper > .swiper-slide")]
    .sort((x, y) => (+x.dataset.swiperSlideIndex || 0) - (+y.dataset.swiperSlideIndex || 0));
  const cards = slides.map((s) => s.querySelector(".link-section"));
  const shown = (c) => { const r = c.getBoundingClientRect(); const op = +getComputedStyle(c.closest(".swiper-slide")).opacity;
    return op > 0.05 && Math.min(r.right, hr.right) - Math.max(r.left, hr.left) > 2; };
  const visible = cards.filter(shown);
  const chips = (bar, k) => [...bar.querySelectorAll(".area-chip")].map((c) => ({ key: c.dataset[k], active: c.classList.contains("is-active"), title: c.title }));
  const pick = (p) => JSON.stringify({ effect: p.effect, loop: p.loop, slidesPerView: p.slidesPerView, spaceBetween: p.spaceBetween, grabCursor: p.grabCursor,
    touchRatio: p.touchRatio, resistanceRatio: p.resistanceRatio, creativeEffect: p.creativeEffect, keyboard: p.keyboard, allowTouchMove: p.allowTouchMove, simulateTouch: p.simulateTouch });
  const active = sw.slides[sw.activeIndex]; const ar = active.getBoundingClientRect();
  const xpCard = document.querySelector(".projects-swiper .swiper-slide-active .link-section");
  return {
    boxes: [...document.querySelectorAll("main .section-box")].map((b) => b.className + "|" + (b.querySelector(".box-title")?.textContent || "")),
    areas: chips(areaRow, "field"), projects: chips(projRow, "project"),
    cards: cards.map((c) => ({ kind: c.dataset.kind, name: c.dataset.card, code: c.dataset.code, shownCode: c.querySelector(".section-title .card-code")?.textContent, project: c.dataset.project, field: c.dataset.field,
      banner: !!c.querySelector("img.featured-image"), columns: [...c.querySelectorAll(".tools-column > .tools-column__header")].map((h) => h.textContent),
      toolLinks: c.querySelectorAll(".tools-column a.tool-link > img.icon").length,
      privateLinks: c.querySelectorAll("a.tool-link--private").length, width: c.offsetWidth,
      xpClasses: !!c.querySelector(":scope > h2.section-title") && !!c.querySelector(":scope > img.featured-image") && !!c.querySelector(":scope > .links-container") })),
    xpWidth: xpCard?.offsetWidth || 0,
    bannerLoaded: (() => { const i = sw.slides[sw.activeIndex].querySelector("img.featured-image"); return !!i && i.complete && i.naturalWidth > 0; })(),
    sameType: sw.constructor === xp.constructor, sameParams: pick(sw.params) === pick(xp.params), params: pick(sw.params),
    realIndex: sw.realIndex, animating: sw.animating, settled: Math.abs(ar.left - hr.left) < 2 && +getComputedStyle(active).opacity > 0.99,
    dots: sec.querySelectorAll(".swiper-pagination .swiper-pagination-bullet").length,
    visible: visible.map((c) => c.dataset.card),
    indexInView: inView(areaRow) && inView(projRow), fullCardInView: visible.length === 1 && inView(visible[0]),
    cardRect: visible[0] ? JSON.stringify(visible[0].getBoundingClientRect().toJSON(), (k, v) => typeof v === 'number' ? Math.round(v) : v) + ` vp ${vw}x${vh}` : '',
  };
}));

const AREA_HOME = "#area";
const expectCards = (field, project) => {
  const a = data.areas.find((x) => x.field === field);
  const cards = project === AREA_HOME ? [a.home] : a.projects.find((x) => x.name === project).cards;
  return cards.map((c) => `${c.data.kind}:${c.data.card}:${c.code}`);
};
const firstProject = (a) => (a.home ? AREA_HOME : a.projects[0].name);
const gotCards = (r) => r.cards.map((c) => `${c.kind}:${c.name}:${c.shownCode}`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function check(r, field, project, errs, tag) {
  const area = data.areas.find((a) => a.field === field);
  if (!same(r.areas.map((c) => c.key), data.areas.map((a) => a.field))) errs.push(`${tag}: area chips != areas`);
  if (r.areas.filter((c) => c.active).map((c) => c.key).join() !== field) errs.push(`${tag}: active area != ${field}`);
  if (!same(r.projects.map((c) => c.key), [...(area.home ? [AREA_HOME] : []), ...area.projects.map((p) => p.name)])) errs.push(`${tag}: project chips != ${field} projects`);
  if (r.projects.filter((c) => c.active).map((c) => c.key).join() !== project) errs.push(`${tag}: active project != ${project}`);
  if (r.areas.some((c) => !c.title) || r.projects.some((c) => !c.title)) errs.push(`${tag}: chip tooltip`);
  if (!same(gotCards(r), expectCards(field, project))) errs.push(`${tag}: cards ${gotCards(r).join(",")} != data`);
  if (!["home", "area"].includes(r.cards[0]?.kind) || !r.cards[0].banner) errs.push(`${tag}: home card first with banner`);
  if (!r.bannerLoaded) errs.push(`${tag}: active card banner did not load`);
  if (r.cards.some((c) => c.code !== c.shownCode)) errs.push(`${tag}: card titles do not show their outline code`);
  if (r.cards.some((c) => !c.xpClasses)) errs.push(`${tag}: card not built from the xProjects card classes`);
  if (r.xpWidth && Math.abs(r.cards[r.realIndex].width - r.xpWidth) > 4) errs.push(`${tag}: card width ${r.cards[r.realIndex].width} != xProjects card ${r.xpWidth}`);
  if (!r.sameType || !r.sameParams) errs.push(`${tag}: not the xProjects Swiper (type ${r.sameType}, params ${r.params})`);
  if (r.dots !== r.cards.length) errs.push(`${tag}: ${r.dots} dots for ${r.cards.length} cards`);
  if (r.visible.length !== 1) errs.push(`${tag}: ${r.visible.length} cards in view`);
  if (r.cards.some((c) => c.privateLinks)) errs.push(`${tag}: private entry carries a link`);
  if (!r.indexInView || !r.fullCardInView) errs.push(`${tag}: one screen: index ${r.indexInView}, full card ${r.fullCardInView} ${r.cardRect}`);
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
  check(r, a0.field, firstProject(a0), errs, "default");
  if (shot) await page.screenshot({ path: `${shot}-${label}.png` });
  // a home card has no application links: only card / repo / webapp rows and the landing link
  const hc = await page.evaluate(() => [...document.querySelectorAll(".areas-swiper .swiper-slide-active .tool-link")].map((a) => a.textContent.trim()));
  if (hc.some((t) => !["Card", "Repo", "Webapp"].includes(t))) errs.push(`Unix home links ${hc.join(",")}`);
  // #1330 in-page card links: Unix home -> Cloudy home -> Android card, each click lands on (and shows) the target card
  const jump = async (from, to, want) => {
    await page.click(`.areas-swiper .swiper-slide-active a[data-card="${to}"]`);
    await page.waitForFunction(() => !document.querySelector(".areas-swiper").swiper.animating);
    const g = await state(page);
    const on = g.cards[g.realIndex];
    if (on?.name !== want || g.visible.join() !== want) errs.push(`card link ${from} -> ${to}: landed on ${on?.name}, in view ${g.visible.join()}`);
    return g;
  };
  let g = await jump("Unix", "area-1.1.0", "Cloudy");
  if (g.projects.filter((c) => c.active).map((c) => c.key).join() !== "Cloudy") errs.push("card link: Cloudy chip not active");
  if (g.cards[g.realIndex].code !== "1.1.0") errs.push("card link: not the Cloudy home card");
  if (shot) await page.screenshot({ path: `${shot}-${label}-cloudy-home.png` });
  g = await jump("Cloudy", "area-1.1.1", "Android");
  if (g.realIndex !== 1) errs.push(`card link: Android is card ${g.realIndex}, want 1`);
  if (shot) await page.screenshot({ path: `${shot}-${label}-card-link-android.png` });
  await page.click('[data-projects-row] .area-chip[data-project="Cloudy"]');
  await page.waitForFunction(() => !document.querySelector(".areas-swiper").swiper.animating);
  r = await state(page);
  // Next arrow: one card further (swipe/drag/arrow behaviour of every carousel: tests/e2e/carousels.mjs).
  const before = r.realIndex;
  await page.click(".areas-section .swiper-button-next");
  await page.waitForFunction(() => !document.querySelector(".areas-swiper").swiper.animating);
  const n = await state(page);
  if (n.realIndex !== (before + 1) % n.cards.length || n.visible.length !== 1) errs.push(`next arrow: ${before} -> ${n.realIndex}, in view ${n.visible.join(",")}`);
  if (shot) {
    await page.locator(".projects-section").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelector(".projects-section").scrollIntoView({ block: "start" }));
    // compare against an xProjects card that has a banner, like every Areas card
    // (with the next arrow, as a user would: an instant slideTo leaves the creative effect unpainted)
    for (let k = 0; k < 12; k++) {
      const has = await page.evaluate(() => { const s = document.querySelector(".projects-swiper").swiper; return !!s.slides[s.activeIndex].querySelector("img.featured-image"); });
      if (has) break;
      await page.click(".projects-section .swiper-button-next");
      await page.waitForFunction(() => !document.querySelector(".projects-swiper").swiper.animating);
    }
    await page.waitForFunction(() => { const s = document.querySelector(".projects-swiper").swiper, i = s.slides[s.activeIndex].querySelector("img.featured-image");
      return !i || (i.complete && i.naturalWidth > 0 && +getComputedStyle(s.slides[s.activeIndex]).opacity > 0.99); }, null, { timeout: 20000 }).catch(() => {});
    await page.screenshot({ path: `${shot}-${label}-xprojects.png` });
    await page.evaluate(() => document.querySelector(".areas-section").scrollIntoView({ block: "start" }));
  }
  // Unix -> Cloudy: Android card lists the fleet apps
  await page.click('[data-areas-row] .area-chip[data-field="Unix"]');
  await page.click('[data-projects-row] .area-chip[data-project="Cloudy"]');
  await page.waitForSelector('[data-projects-row] .area-chip.is-active');
  r = await state(page);
  check(r, "Unix", "Cloudy", errs, "Unix/Cloudy");
  // #1308: every card is the xProjects tools card: .tools-dashboard > .tools-column of icon + label links
  const want = data.areas.find((a) => a.field === "Unix").projects.find((p) => p.name === "Cloudy").cards.find((c) => c.title === "Android");
  if (!same(r.cards.find((c) => c.name === "Android")?.columns, want.columns.map((c) => c.header))) errs.push("Cloudy Android columns != data");
  if (r.cards.some((c) => !c.columns.length || !c.toolLinks)) errs.push("an Areas card is not a tools card (columns of tool links)");
  if (shot) {
    await page.screenshot({ path: `${shot}-${label}-unix-cloudy.png` });
    // side by side: the active Areas card next to the xProjects SUITE card, same renderer
    const areaCard = await page.locator(".areas-swiper .swiper-slide-active .link-section").screenshot();
    await page.evaluate(() => { const s = document.querySelector(".projects-swiper").swiper;
      const i = s.slides.findIndex((x) => x.querySelector(".section-title")?.textContent.trim() === "SUITE"); s.slideTo(i, 0); });
    await page.evaluate(() => document.querySelector(".projects-section").scrollIntoView({ block: "start" }));
    await page.waitForTimeout(800);
    const suite = await page.locator(".projects-swiper .swiper-slide-active .link-section").screenshot();
    const [a, b] = [areaCard, suite].map((x) => `data:image/png;base64,${x.toString("base64")}`);
    const cmp = await ctx.newPage();
    await cmp.setContent(`<body style="margin:0;background:#111;display:flex;gap:8px;align-items:flex-start"><img src="${a}"><img src="${b}"></body>`);
    await cmp.screenshot({ path: `${shot}-${label}-side-by-side.png`, fullPage: true });
    await cmp.close();
    await page.evaluate(() => document.querySelector(".areas-section").scrollIntoView({ block: "start" }));
  }
  // Unix -> Cloud-Me: home, Pub, Pvt; persisted across reload
  await page.click('[data-projects-row] .area-chip[data-project="Cloud-Me"]');
  await page.waitForSelector('[data-projects-row] .area-chip.is-active');
  r = await state(page);
  check(r, "Unix", "Cloud-Me", errs, "Unix/Cloud-Me");
  if (!same(gotCards(r), ["home:Cloud-Me:1.2.0", "subcategory:Pub:1.2.1", "subcategory:Pvt:1.2.2"])) errs.push("Cloud-Me Pub/Pvt split");
  // 3 Capital: flat area, its 3.0 area home card first, then its three projects
  await page.click('[data-areas-row] .area-chip[data-field="Capital"]');
  await page.waitForSelector(`[data-projects-row] .area-chip.is-active[data-project="${AREA_HOME}"]`);
  r = await state(page);
  check(r, "Capital", AREA_HOME, errs, "Capital home");
  if (!same(r.projects.slice(1).map((c) => c.key), ["Macro-Central-Bank", "Micro-Asset-Management", "Stack-Fin-Terminal"])) errs.push(`Capital projects ${r.projects.map((c) => c.key)}`);
  if (shot) await page.screenshot({ path: `${shot}-${label}-capital.png` });
  const pick = data.areas.slice(1).sort((a, b) => b.projects.length - a.projects.length)[0];
  await page.click(`[data-areas-row] .area-chip[data-field="${pick.field}"]`);
  const pp = pick.projects[pick.projects.length - 1].name;
  await page.click(`[data-projects-row] .area-chip[data-project="${pp}"]`);
  await page.close();
  page = await open(ctx);
  r = await state(page);
  check(r, pick.field, pp, errs, "after reload");
  console.log(label, `${r.areas.length} areas, ${r.projects.length} projects, ${r.cards.length} cards, ${r.visible.length} in view, same Swiper as xProjects=${r.sameType && r.sameParams}`, errs.length ? `FAIL ${errs.join("; ")}` : "OK");
  if (errs.length) failed = true;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
