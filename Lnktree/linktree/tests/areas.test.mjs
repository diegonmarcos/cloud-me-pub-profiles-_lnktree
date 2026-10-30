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
import { deriveAreas, serialize, loadSources, SKIP_AREAS } from "../scripts/areas-gen.mjs";

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

test("section order: Profiles < Areas < Personal Profiles < xProjects; two-level index above the cards", () => {
  const at = (c) => html.indexOf(`class="section-box ${c}"`);
  const prof = at("professional-profiles-section"), area = at("areas-section"), pers = at("personal-profiles-section"), xp = at("projects-section");
  assert.ok(prof >= 0 && area >= 0 && pers >= 0 && xp >= 0, "all four sections exist");
  assert.ok(prof < area && area < pers && pers < xp, "order");
  assert.equal(html.split('class="section-box areas-section"').length, 2, "exactly one Areas section");
  const box = html.slice(area, html.indexOf("</section>", area));
  const pos = ["data-areas-row", "data-projects-row", "data-area-cards"].map((m) => box.indexOf(m));
  assert.ok(pos.every((x) => x >= 0) && pos[0] < pos[1] && pos[1] < pos[2], "areas row, projects row, then cards");
  assert.match(box, /class="swiper-button-prev"/); assert.match(box, /class="swiper-button-next"/);
  assert.match(html.slice(xp, html.indexOf("</section>", xp)), /<h2 class="box-title">xPROJECTS<\/h2>/, "old Projects renamed xProjects");
});

test("areas.json is exactly what the sources derive (no drift)", { skip: sources ? false : `sources unavailable: ${sourceError}` }, () => {
  assert.equal(committed, serialize(deriveAreas(sources)));
});

// Every node of the registry outline in order, with its code.
const outline = (reg) => reg.areas.filter((a) => !SKIP_AREAS.includes(a.name));
const allCards = () => areas.areas.flatMap((a) => [...(a.home ? [a.home] : []), ...a.projects.flatMap((p) => p.cards)]);

test("outline (#1293): areas, projects and cards follow repos-github.json areas[] in order, with its codes", { skip: !sources }, () => {
  const want = outline(registry);
  assert.deepEqual(areas.areas.map((a) => `${a.code} ${a.field}`), want.map((a) => `${a.code} ${a.label || a.name}`));
  for (const [i, a] of want.entries()) {
    const got = areas.areas[i];
    assert.equal(got.icon, a.icon, `${a.name} icon`);
    assert.equal(!!got.home, !!a.hub, `${a.name}: area home card iff the area has a hub`);
    assert.deepEqual(got.projects.map((p) => `${p.code} ${p.name}`), a.children.map((p) => `${p.code} ${p.label || p.name}`), `${a.name} projects`);
    for (const [j, p] of a.children.entries()) {
      const gp = got.projects[j];
      assert.equal(gp.icon, p.icon || a.icon, `${p.name} icon`);
      assert.deepEqual(gp.cards.map((c) => `${c.code} ${c.data.kind}`), [`${p.code}.0 home`, ...(p.children || []).map((c) => `${c.code} ${c.kind}`)], `${p.name} cards`);
      assert.deepEqual(gp.cards.slice(1).map((c) => c.title), (p.children || []).map((c) => c.label || c.name), `${p.name} card titles`);
    }
  }
});

// #1308: every Areas card is an xProjects tools slide: banner, >= 1 column, apps = icon + short label + url.
test("every Areas card is a kind:tools slide; every link has label (<= 20 chars), url and icon", () => {
  const icons = new Set(fs.readdirSync(path.join(root, "src/public/icons")));
  const cards = allCards();
  assert.ok(cards.length >= 30, `${cards.length} cards`);
  for (const c of cards) {
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
        assert.match(l.url, /^https:\/\//, `${tag}: ${l.label} url`);
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
  assert.match(ts, /import \{ renderToolsSlide, type SlideTools \} from '\.\/portal-render'/, "areas.ts imports it");
  assert.match(ts, /row\.appendChild\(renderToolsSlide\(s\)\)/, "every Areas card goes through it");
  assert.doesNotMatch(ts, /slideCard|tools-column|tools-dashboard|tool-link|featured-image|section-title/, "areas.ts builds no card markup itself");
});

test("Cloudy: home card = its families with their top apps; Android card = the fleet apps by category", () => {
  const proj = (f, n) => areas.areas.find((a) => a.field === f)?.projects.find((p) => p.name === n);
  const cloudy = proj("Unix", "Cloudy");
  assert.equal(cloudy.cards[0].code, "1.1.0");
  const [home] = cloudy.cards, android = cloudy.cards.find((c) => c.title === "Android");
  assert.deepEqual(home.columns.map((c) => c.header), cloudy.cards.slice(1).map((c) => c.title.toUpperCase()).slice(0, 12), "home columns = families");
  for (const c of home.columns) assert.ok(c.links.length <= 6, `home ${c.header}: top apps only`);
  const tax = JSON.parse(fs.readFileSync(path.join(root, "scripts/areas-taxonomy.json"), "utf8"));
  const order = [...Object.keys(tax.android.categories), "OTHER"];
  const headers = android.columns.map((c) => c.header);
  assert.deepEqual(headers, order.filter((h) => headers.includes(h)), "Android columns in declared category order");
  const labels = android.columns.flatMap((c) => c.links.map((l) => l.label));
  for (const want of ["Account", "Browser", "C3", "Drive", "Mail"]) assert.ok(labels.includes(want), `Android lists ${want}`);
  if (sources?.apps["cloudy-u-android"]) assert.equal(labels.length, sources.apps["cloudy-u-android"].length, "every declared app once");
  const drive = android.columns.flatMap((c) => c.links).find((l) => l.label === "Drive");
  assert.equal(drive.url, "https://diegonmarcos.github.io/cloud-web/apps/cloud-drive/", "web app -> its cloud-web page");
  const game = proj("CG", "Zirkus").cards.flatMap((c) => c.columns).find((c) => c.header === "GAME PRODUCTION");
  assert.deepEqual(game?.links.map((l) => l.label).sort(), ["GDevelop", "Godot", "Unity"]);
  assert.ok(game.links.every((l) => l.url.startsWith("https://github.com/diegonmarcos/CG-circus/tree/main/Game-Production/")), "content family apps link into CG-circus");
  const fin = proj("Capital", "Stack-Fin-Terminal").cards[1].columns.flatMap((c) => c.links.map((l) => l.label));
  for (const want of ["Fin-Terminal", "GDELT-News", "MarketWatch"]) assert.ok(fin.includes(want), `Fin terminal lists ${want}`);
  const cad = proj("HardTech", "Stack-CAD-Simulators").cards[1].columns.flatMap((c) => c.links.map((l) => l.label));
  for (const want of ["OpenCAD", "OpenRevit", "OpenBIM"]) assert.ok(cad.includes(want), `CAD lists ${want}`);
  const st = proj("HardTech", "Structural");
  assert.equal(st.planned, true); assert.equal(st.cards.length, 1); assert.equal(st.cards[0].tagline, "planned");
  assert.equal(st.cards[0].columns[0].links[0].url, "https://github.com/diegonmarcos/HardTech-Stack-CAD-Simulators/tree/main/Structural-Designer");
  for (const f of ["Capital", "HardTech"]) assert.ok(areas.areas.find((a) => a.field === f).home, `${f} area home card`);
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
