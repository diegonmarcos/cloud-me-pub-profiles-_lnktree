// #1277/#1281/#1293/#1308 Areas: placement, registry + app-manifest coverage, card split and groupings. Dependency-free (node:test), run by the build
// (build.json npm step "areas") right after scripts/areas-gen.mjs regenerates src/data/areas.json.
//   node --test tests/areas.test.mjs        (registry: $REPOS_GITHUB_JSON path, else the raw GitHub URL)
// Also collected by vitest (vitest.config.ts includes *.test.mjs): under vitest ($VITEST set) the same cases run on
// vitest's test(), whose (name, options, fn) signature matches node:test's.
const { test } = process.env.VITEST ? await import("vitest") : await import("node:test");
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveAreas, serialize, loadSources, SKIP_AREAS, CARDS } from "../scripts/areas-gen.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const committed = fs.readFileSync(path.join(root, "src/data/areas.json"), "utf8");
const areas = JSON.parse(committed);
// Sources as the generator reads them. Locally, when GitHub is unreachable the generator kept the committed file and
// the source-based tests are skipped; in CI ($CI set) unreachable sources FAIL, so a stale areas.json cannot ship.
let sources = null, sourceError = "";
try { sources = await loadSources(); } catch (e) { sourceError = e.message; }
test("sources reachable in CI", { skip: process.env.CI ? false : "local run" }, () => assert.ok(sources, `areas sources unavailable in CI: ${sourceError}`));
const registry = sources?.registry;

test("section order: Profiles < Areas < Personal Profiles < xProjects; three-level index above the cards", () => {
  const at = (c) => html.indexOf(`class="section-box ${c}"`);
  const prof = at("professional-profiles-section"), area = at("areas-section"), pers = at("personal-profiles-section"), xp = at("projects-section");
  assert.ok(prof >= 0 && area >= 0 && pers >= 0 && xp >= 0, "all four sections exist");
  assert.ok(prof < area && area < pers && pers < xp, "order");
  assert.equal(html.split('class="section-box areas-section"').length, 2, "exactly one Areas section");
  const box = html.slice(area, html.indexOf("</section>", area));
  const pos = ["data-areas-row", "data-projects-row", "data-families-row", "data-area-cards"].map((m) => box.indexOf(m));
  assert.ok(pos.every((x) => x >= 0) && pos.every((x, i) => i === 0 || pos[i - 1] < x), "areas row, projects row, families row, then cards");
  assert.match(box, /class="swiper-button-prev"/); assert.match(box, /class="swiper-button-next"/);
  assert.match(html.slice(xp, html.indexOf("</section>", xp)), /<h2 class="box-title">xPROJECTS<\/h2>/, "old Projects renamed xProjects");
});

test("areas.json is exactly what the sources derive (no drift)", { skip: sources ? false : `sources unavailable: ${sourceError}` }, () => {
  assert.equal(committed, serialize(deriveAreas(sources)));
});

// Every node of the registry outline in order, with its code. Families follow areas-cards.json family_order.
const outline = (reg) => reg.areas.filter((a) => !SKIP_AREAS.includes(a.name));
const famName = (c) => c.label || c.name;
const ordered = (p) => { const o = CARDS.family_order?.[p.code] || [], r = (c) => (o.includes(famName(c)) ? o.indexOf(famName(c)) : o.length);
  return (p.children || []).map((c, i) => [c, i]).sort((x, y) => r(x[0]) - r(y[0]) || x[1] - y[1]).map(([c]) => c); };
const movedKey = (p, c) => `${p.code}/${famName(c)}`;
const allCards = () => areas.areas.flatMap((a) => [...(a.home ? [a.home] : []), ...a.projects.flatMap((p) => p.cards)]);
// Declared cards moved from xProjects (areas-cards.json): rendered as-is, so the derived-card format rules do not apply.
const movedTitles = new Set(Object.values(CARDS.family_cards || {}).map((c) => c.title));
const isMoved = (c) => movedTitles.has(c.title) && Object.keys(CARDS.family_cards || {}).some((k) => k.endsWith(`/${c.data.card}`));

test("outline (#1293): areas, projects and cards follow repos-github.json areas[] in order, with its codes", { skip: !sources }, () => {
  const want = outline(registry);
  assert.deepEqual(areas.areas.map((a) => `${a.code} ${a.field}`), want.map((a) => `${a.code} ${a.label || a.name}`));
  for (const [i, a] of want.entries()) {
    const got = areas.areas[i];
    assert.equal(got.icon, a.icon, `${a.name} icon`);
    assert.ok(got.home, `${a.name}: every area has a home card`);
    assert.deepEqual(got.projects.map((p) => `${p.code} ${p.name}`), a.children.map((p) => `${p.code} ${p.label || p.name}`), `${a.name} projects`);
    for (const [j, p] of a.children.entries()) {
      const gp = got.projects[j];
      assert.equal(gp.icon, p.icon || a.icon, `${p.name} icon`);
      assert.deepEqual(gp.cards.map((c) => `${c.code} ${c.data.kind}`), [`${p.code}.0 home`, ...ordered(p).map((c) => `${c.code} ${c.kind}`)], `${p.name} cards`);
      assert.deepEqual(gp.cards.slice(1).map((c) => c.data.card), ordered(p).map(famName), `${p.name} family names`);
      assert.deepEqual(gp.cards.slice(1).map((c) => c.title), ordered(p).map((c) => CARDS.family_cards?.[movedKey(p, c)]?.title || famName(c)), `${p.name} card titles (moved cards keep their own)`);
    }
  }
});

// #1308: every Areas card is an xProjects tools slide: banner, >= 1 column, apps = icon + short label + url.
test("every Areas card is a kind:tools slide; every link has label (<= 20 chars), url and icon", () => {
  const icons = new Set(fs.readdirSync(path.join(root, "src/public/icons")));
  const cards = allCards();
  assert.ok(cards.length >= 30, `${cards.length} cards`);
  for (const c of cards.filter((x) => !isMoved(x))) {
    const tag = `${c.code} ${c.title}`;
    assert.equal(c.kind, "tools", `${tag}: kind tools`);
    assert.ok(c.id && c.title && c.code, `${tag}: id, title, code`);
    assert.match(c.image?.src || "", /^public\/images\/banners\/[\w.-]+\.(gif|webp|jpg|png)$/, `${tag}: banner`);
    assert.ok(fs.existsSync(path.join(root, "src", c.image.src)), `${tag}: ${c.image.src} exists`);
    assert.ok(c.columns.length >= 1, `${tag}: >= 1 column`);
    assert.ok(!("description" in c) && !("brief" in c) && (!c.tagline || c.tagline.length <= 60), `${tag}: no long description text`);
    for (const col of c.columns) {
      assert.ok(col.header && col.links.length >= 1, `${tag}: column ${col.header} has a header and links`);
      assert.equal(typeof col.row, "number", `${tag}: column row`);
      for (const l of col.links) {
        assert.ok(l.label && l.url && l.icon, `${tag}/${col.header}: ${JSON.stringify(l)}`);
        assert.ok(l.label.length <= 20, `${tag}: label "${l.label}" > 20 chars`);
        assert.match(l.url, l.card ? /^#area-[\d.]+$/ : /^https:\/\//, `${tag}: ${l.label} url`);
        assert.ok(icons.has(l.icon), `${tag}: icon ${l.icon} exists`);
        assert.ok(!("description" in l), `${tag}: ${l.label} has no description`);
      }
    }
  }
});

test("Areas renders with the xProjects tools renderer (renderToolsSlide), no own card renderer", () => {
  const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
  const ts = read("src/typescript/modules/areas.ts"), portal = read("src/typescript/modules/portal-render.ts");
  assert.match(portal, /export function renderToolsSlide\(slide: SlideTools\)/, "portal-render exports the tools renderer");
  assert.match(portal, /case 'tools':\s+return renderToolsSlide\(slide\)/, "xProjects tools slides use it");
  assert.match(ts, /import \{ renderToolsSlide, renderReposSlide, type SlideTools, type SlideRepos \} from '\.\/portal-render'/, "areas.ts imports it (and the xProjects repos renderer for the moved Repos card)");
  assert.match(portal, /export function renderReposSlide\(slide: SlideRepos\)/, "portal-render exports the repos renderer");
  assert.match(ts, /renderToolsSlide\(s\)/, "every Areas card goes through it");
  assert.doesNotMatch(ts, /slideCard|tools-column|tools-dashboard|tool-link|featured-image|section-title/, "areas.ts builds no card markup itself");
});

test("Cloudy: families Android, Linux, WebApps, C3 (C3 last); home card = them as rows; Android = the SuperApp Cloud groups", () => {
  const proj = (f, n) => areas.areas.find((a) => a.field === f)?.projects.find((p) => p.name === n);
  const cloudy = proj("Unix", "Cloudy");
  assert.equal(cloudy.cards[0].code, "1.1.0");
  const [home] = cloudy.cards, android = cloudy.cards.find((c) => c.title === "Android");
  assert.deepEqual(home.columns.map((c) => c.header), cloudy.cards.slice(1).map((c) => c.data.card.toUpperCase()), "home columns = families");
  assert.deepEqual(cloudy.cards.slice(1).map((c) => c.data.card), ["Android", "Linux", "WebApps", "C3"], "family order, C3 last");
  assert.deepEqual(home.columns.map((c) => c.header), ["ANDROID", "LINUX", "WEBAPPS", "C3"]);
  const headers = android.columns.map((c) => c.header);
  if (sources?.superapp) assert.deepEqual(headers, sources.superapp.map((g) => g.title.toUpperCase()).filter((h) => headers.includes(h)), "Android columns = SuperApp Cloud tile_groups, in order");
  if (sources?.superapp) assert.equal(headers.length, sources.superapp.filter((g) => g.tiles.some((t) => t.label && t.label !== "|")).length, "every group once");
  for (const want of ["INBOXES", "TOOLS PRIMARY", "DATA APPS", "CONFIGS"]) assert.ok(headers.includes(want), `Android shows the ${want} group`);
  const labels = android.columns.flatMap((c) => c.links.map((l) => l.label));
  for (const want of ["Browser", "C3", "Drive", "Mail"]) assert.ok(labels.includes(want), `Android lists ${want}`);
  assert.ok(!labels.includes("|"), "separator tiles skipped");
  const drive = android.columns.flatMap((c) => c.links).find((l) => l.label === "Drive");
  assert.equal(drive.url, "https://diegonmarcos.github.io/cloud-web/apps/cloud-drive/", "web app -> its cloud-web page");
  const game = proj("CG", "Zirkus").cards.slice(1).flatMap((c) => c.columns).find((c) => c.header === "GAME PRODUCTION");
  assert.deepEqual(game?.links.map((l) => l.label).sort(), ["GDevelop", "Godot", "Unity"]);
  assert.ok(game.links.every((l) => l.url.startsWith("https://github.com/diegonmarcos/CG-circus/tree/main/Game-Production/")), "content family apps link into CG-circus");
  const fin = proj("Capital", "Stack-Fin-Terminal").cards[1].columns.flatMap((c) => c.links.map((l) => l.label));
  for (const want of ["Fin-Terminal", "GDELT-News", "MarketWatch"]) assert.ok(fin.includes(want), `Fin terminal lists ${want}`);
  const cad = proj("HardTech", "Stack-CAD-Simulators").cards[1].columns.flatMap((c) => c.links.map((l) => l.label));
  for (const want of ["OpenCAD", "OpenRevit", "OpenBIM"]) assert.ok(cad.includes(want), `CAD lists ${want}`);
  const st = proj("HardTech", "Structural");
  assert.equal(st.planned, true); assert.equal(st.cards.length, 1); assert.equal(st.cards[0].tagline, "planned");
  assert.equal(st.cards[0].columns[0].links[0].url, "https://github.com/diegonmarcos/HardTech-Stack-CAD-Simulators/tree/main/Structural-Designer");
});

test("private repos: name with a lock, no repo URL; no archived repo", () => {
  if (registry) for (const r of registry.repos.filter((x) => x.visibility !== "public")) assert.ok(!committed.includes(`"${r.url}`), `private repo URL ${r.url} absent`);
  assert.ok(!committed.includes("z-archived_"));
});

test("one carousel and one card for every section; no per-section swipe or card code (#1293)", () => {
  const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
  const ts = read("src/typescript/modules/areas.ts"), portal = read("src/typescript/modules/portal-render.ts");
  const carousel = read("src/typescript/modules/carousel.ts"), card = read("src/typescript/modules/card.ts");
  const scss = read("src/scss/components/_areas.scss"), shared = read("src/scss/components/_carousel.scss");
  // Every section box with cards uses the identical carousel skeleton, registered by data-carousel.
  const ids = [];
  for (const m of html.matchAll(/<section class="section-box ([\w-]+)"[\s\S]*?<\/section>/g)) {
    const box = m[0];
    if (!box.includes("carousel-row")) continue;
    const id = box.match(/<div class="swiper [\w-]+" data-carousel="([\w-]+)">/)?.[1];
    assert.ok(id, `${m[1]}: .swiper[data-carousel]`);
    ids.push(id);
    for (const c of ['class="swiper-wrapper"', 'class="swiper-button-prev"', 'class="swiper-button-next"', 'class="swiper-pagination"'])
      assert.ok(box.includes(c), `${m[1]} has ${c}`);
  }
  assert.deepEqual(ids, ["professional", "areas", "personal", "projects"]);
  // One Swiper construction in the whole bundle, inside carousel.ts; no hand-rolled swipe/snap code anywhere else.
  const tsFiles = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? tsFiles(path.join(d, e.name)) : e.name.endsWith(".ts") ? [path.join(d, e.name)] : []);
  for (const f of tsFiles(path.join(root, "src/typescript"))) {
    const src = fs.readFileSync(f, "utf8"), rel = path.relative(root, f);
    if (rel.endsWith("modules/carousel.ts")) continue; // the one carousel (and its tap-image stacks)
    assert.doesNotMatch(src, /new Swiper\(|from 'swiper/, `${rel}: Swiper only in carousel.ts`);
    assert.doesNotMatch(src, /touches\[0\]\.clientX|changedTouches|scrollBy\(|scroll-snap/, `${rel}: no hand-rolled swipe code`);
  }
  assert.equal((carousel.match(/new Swiper\(/g) || []).length, 1, "one Swiper construction");
  for (const gone of ["cardSwiper.ts", "profilePicSwiper.ts", "mobileScroll.ts"]) assert.ok(!fs.existsSync(path.join(root, "src/typescript/modules", gone)), `${gone} deleted`);
  assert.doesNotMatch(carousel, /professionalSwiper|personalSwiper|projectsSwiper|registerCarousel|85dvh/, "no per-section instances or forced heights");
  // One card builder used by both renderers, one el() helper.
  assert.match(card, /export function slideCard\(/);
  for (const [name, src] of [["portal-render.ts", portal], ["areas.ts", ts]]) {
    if (name === "portal-render.ts") assert.match(src, /import \{ slideCard \} from '\.\/card'/, `${name} uses slideCard`);
    assert.match(src, /import \{ el \} from '\.\.\/utils\/dom'/, `${name} uses the one el()`);
    assert.doesNotMatch(src, /function el\b|function featuredImg|class: 'link-section'|'link-section'/, `${name}: no own card shell`);
  }
  assert.match(ts, /refreshCarousel\('areas', \(\) => \{/, "Areas re-mounts the shared carousel on project change");
  assert.doesNotMatch(scss, /scroll-snap-stop|\.area-card|swiper-slide|link-section|featured-image/, "no Areas card/swipe styles");
  assert.match(shared, /\.carousel-row > \.swiper \{/, "one swiper rule for every section");
});

// ---------------------------------------------------------------------------------------------------------------
// #1330 home cards: area home first in every area; home cards list children (card / repo / webapp) and a landing link.
// ---------------------------------------------------------------------------------------------------------------
const tax = JSON.parse(fs.readFileSync(path.join(root, "scripts/areas-taxonomy.json"), "utf8"));
const H = tax.home;
const kindOf = (l) => (l.card ? "card" : l.label === H.repo.label ? "repo" : l.label === H.webapp.label ? "webapp" : "other");
const rowsOf = (card) => card.columns.map((c) => ({ header: c.header, links: c.links, kinds: c.links.map(kindOf) }));
const landingOf = (card) => card.extras?.primary_link;
const plannedProject = (p) => p.planned;
const allHomes = () => areas.areas.flatMap((a) => [{ a, card: a.home, node: a, children: a.projects }, ...a.projects.map((p) => ({ a, card: p.cards[0], node: p, children: p.cards.slice(1) }))]);

test("every area's first card is its home card, titled with the area name (Unix first)", () => {
  for (const a of areas.areas) {
    assert.ok(a.home, `${a.field} has a home card`);
    assert.equal(a.home.code, `${a.code}.0`);
    assert.equal(a.home.id, `area-${a.code}.0`);
    assert.equal(a.home.title.replace(/^\S+\s/, ""), a.field, `${a.field}: title = area name`);
    assert.equal(a.home.data.kind, "area");
    assert.deepEqual(a.home.columns.map((c) => c.header), a.projects.map((p) => p.name.toUpperCase()), `${a.field}: home rows = its projects, in order`);
  }
  assert.equal(areas.areas[0].field, "Unix");
  assert.deepEqual(areas.areas[0].home.columns.map((c) => c.header), ["CLOUDY", "CLOUD-ME"]);
});

test("home cards (area and project) contain no application links: only card, repo, webapp rows and the landing", () => {
  for (const { card, node } of allHomes()) {
    if (plannedProject(node)) continue; // a planned project has no children yet: its one link is the folder where it will live
    for (const r of rowsOf(card)) for (const [i, l] of r.links.entries()) {
      assert.notEqual(r.kinds[i], "other", `${card.title}/${r.header}: link "${l.label}" is not a card/repo/webapp row`);
      assert.ok(!/\/tree\//.test(l.url), `${card.title}/${r.header}: no folder (app) URL ${l.url}`);
    }
    assert.ok(card.columns.every((c) => c.links.length <= 3), `${card.title}: at most card + repo + webapp per row`);
  }
});

test("every child row has its card link (to an existing card) and its repo link, in order", () => {
  for (const { a, card, node, children } of allHomes()) {
    if (plannedProject(node) || !children.length) continue;
    const rows = rowsOf(card);
    assert.equal(rows.length, children.length, `${card.title}: one row per child`);
    for (const [i, r] of rows.entries()) {
      assert.deepEqual(r.kinds.slice(0, 2), ["card", "repo"], `${card.title}/${r.header}: card then repo`);
      const child = children[i];
      const target = child.cards ? child.cards[0] : child;
      assert.equal(r.links[0].card, target.id, `${card.title}/${r.header}: card link -> ${target.id}`);
      assert.equal(r.links[0].url, `#${target.id}`);
      const same = allCards().filter((c) => c.id === target.id);
      assert.equal(same.length, 1, `${target.id} is a unique card`);
      assert.ok(a.home.id === target.id || a.projects.some((p) => p.cards.some((c) => c.id === target.id)), "target card is in the same area");
      assert.match(r.links[1].url, /^https:\/\/github\.com\/diegonmarcos(\/[\w.-]+)?$/, `${card.title}/${r.header}: repo url`);
    }
  }
});

test("repo links: the project hub (else the area hub) for projects; webapp links only where the registry declares webapp", { skip: !sources }, () => {
  const byName = new Map(registry.repos.map((r) => [r.name, r]));
  for (const [ai, a] of outline(registry).entries()) {
    const got = areas.areas[ai];
    for (const [pi, p] of a.children.entries()) {
      const row = got.home.columns[pi];
      const hub = byName.get(p.hub) || byName.get(a.hub);
      if (hub) assert.equal(row.links[1].url, hub.visibility === "public" ? hub.url : tax.private_url, `${a.name}/${p.name}: repo = hub ${hub.name}`);
      const w = row.links.find((l) => kindOf(l) === "webapp");
      assert.equal(w?.url, p.webapp, `${a.name}/${p.name}: project webapp = registry`);
      const pcard = got.projects[pi].cards[0];
      for (const f of p.children || []) {
        const r = pcard.columns.find((c) => c.header === famName(f).toUpperCase());
        assert.equal(r.links.find((l) => kindOf(l) === "webapp")?.url, f.webapp, `${p.name}/${f.name}: family webapp = registry`);
        const fh = byName.get(f.hub) || byName.get([f.hub, ...(f.repos || [])][0] ?? "");
        if (fh && fh.visibility === "public") assert.equal(r.links[1].url, fh.url, `${p.name}/${f.name}: repo = ${fh.name}`);
      }
    }
  }
  // the owner's two examples
  const cloudy = areas.areas[0].projects[0].cards[0];
  const web = (h) => cloudy.columns.find((c) => c.header === h).links.find((l) => kindOf(l) === "webapp")?.url;
  assert.equal(web("ANDROID"), "https://diegonmarcos.github.io/cloud-webapps/");
  assert.equal(web("C3"), "https://diegonmarcos.github.io/cloudy-c3/");
  assert.equal(web("LINUX"), undefined);
  assert.equal(web("WEBAPPS"), undefined);
});

test("the landing link is the last element of a home card, only where the registry declares landing", { skip: !sources }, () => {
  for (const [ai, a] of outline(registry).entries()) {
    const got = areas.areas[ai];
    assert.equal(landingOf(got.home)?.url, a.landing, `${a.name}: area landing`);
    if (a.landing) assert.equal(landingOf(got.home).label, `${a.label || a.name} Area Landpage`);
    for (const [pi, p] of a.children.entries()) {
      const c = got.projects[pi].cards[0];
      assert.equal(landingOf(c)?.url, p.landing, `${p.name}: project landing`);
      if (p.landing) assert.equal(landingOf(c).label, `${p.label || p.name} Project Landpage`);
    }
  }
  const cloudy = areas.areas[0].projects[0].cards[0];
  assert.equal(landingOf(cloudy).label, "Cloudy Project Landpage");
  // the renderer puts extras.primary_link after the columns, i.e. at the bottom of the card
  const portal = fs.readFileSync(path.join(root, "src/typescript/modules/portal-render.ts"), "utf8");
  const fn = portal.slice(portal.indexOf("export function renderToolsSlide"));
  assert.ok(fn.indexOf("for (const col of cols)") < fn.indexOf("for (const lk of primaryLinks)"), "columns first, landing link after");
});

test("in-page card links are wired: renderer emits a no-tab anchor with data-card, areas.ts jumps to the card", () => {
  const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
  const portal = read("src/typescript/modules/portal-render.ts"), ts = read("src/typescript/modules/areas.ts");
  assert.match(portal, /link\.card\s*\?\s*el\('a', \{ class: 'tool-link', href: link\.url, 'data-card': link\.card \}\)/, "card link: same-tab anchor with data-card");
  assert.match(ts, /export function gotoCard/);
  assert.match(ts, /closest<HTMLElement>\('a\[data-card\]'\)/, "click delegation");
  assert.match(ts, /swiper\?\.slideTo\(i, 0\)/, "the carousel moves to the card");
  assert.match(ts, /dataset\['cardId'\] = s\.id/, "slides carry their card id");
});

// ---------------------------------------------------------------------------------------------------------------
// Three rows + moved cards: Linux = xProjects Ducks&Penguins, C3 = xProjects Cloud (renamed), Repos = a direct row-1 entry
// opening the xProjects Repos card. Each card lives in one place: none of them is left in xProjects.
// ---------------------------------------------------------------------------------------------------------------
test("moved cards: Linux = Ducks and Pengs, C3 = the Cloud card renamed, Repos = direct entry; none left in xProjects", () => {
  const projects = JSON.parse(fs.readFileSync(path.join(root, "src/data/projects.json"), "utf8"));
  const ids = projects.slides.map((x) => x.id);
  for (const gone of ["ducks", "cloud", "repos"]) {
    assert.ok(!ids.includes(gone), `xProjects no longer has ${gone}`);
    assert.ok(!html.includes(`data-portal-mount="${gone}"`), `no ${gone} mount left in index.html`);
  }
  const cloudy = areas.areas[0].projects[0].cards;
  const linux = cloudy.find((c) => c.data.card === "Linux"), c3 = cloudy.find((c) => c.data.card === "C3");
  assert.equal(linux.title, "DUCKS AND PENGS"); assert.equal(linux.image.src, "public/images/banners/ducks.gif");
  assert.equal(c3.title, "C3"); assert.equal(c3.image.src, "public/images/banners/cloud.gif");
  assert.deepEqual(areas.direct.map((d) => d.field), ["Repos"]);
  const repos = areas.direct[0].card;
  assert.equal(repos.kind, "repos"); assert.equal(repos.title, "REPOS"); assert.equal(repos.id, "area-repos");
  const icons = new Set(fs.readdirSync(path.join(root, "src/public/icons")));
  for (const c of [linux, c3, repos]) {
    assert.ok(fs.existsSync(path.join(root, "src", c.image.src)), `${c.title}: banner exists`);
    for (const l of [...(c.top_links || []), ...c.columns.flatMap((x) => x.links)]) {
      assert.ok(l.label && l.url && l.icon, `${c.title}: ${JSON.stringify(l)}`);
      assert.ok(icons.has(l.icon), `${c.title}: icon ${l.icon}`);
    }
  }
});

test("renderer: row 2 has no area-home chip, row 3 lists the families, row 1 has the separator then the direct entries", () => {
  const ts = fs.readFileSync(path.join(root, "src/typescript/modules/areas.ts"), "utf8");
  assert.doesNotMatch(ts, /area-chip--home/, "no area-home chip in the projects row");
  assert.match(ts, /\[data-families-row\]/, "families row");
  assert.match(ts, /class: 'areas-sep'/, "separator before the direct entries");
  assert.match(ts, /export function selectDirect/, "direct entries open their card");
});
