// #1277/#1281/#1293 Areas: placement, registry + app-manifest coverage, card split and groupings. Dependency-free (node:test), run by the build
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

test("outline (#1293): areas, projects and cards follow repos-github.json areas[] in order, with its codes", { skip: !sources }, () => {
  const want = outline(registry);
  assert.deepEqual(areas.areas.map((a) => `${a.code} ${a.field}`), want.map((a) => `${a.code} ${a.label || a.name}`));
  for (const [i, a] of want.entries()) {
    const got = areas.areas[i];
    assert.equal(got.icon, a.icon, `${a.name} icon`);
    assert.equal(got.home.length > 0, !!a.hub, `${a.name}: area home card iff the area has a hub`);
    assert.deepEqual(got.projects.map((p) => `${p.code} ${p.name}`), a.children.map((p) => `${p.code} ${p.label || p.name}`), `${a.name} projects`);
    for (const [j, p] of a.children.entries()) {
      const gp = got.projects[j];
      assert.equal(gp.icon, p.icon || a.icon, `${p.name} icon`);
      assert.deepEqual(gp.cards.map((c) => `${c.code} ${c.kind} ${c.name}`), (p.children || []).map((c) => `${c.code} ${c.kind} ${c.label || c.name}`), `${p.name} cards`);
      for (const c of gp.cards) assert.ok(c.code.startsWith(`${gp.code}.`), `${c.code} under ${gp.code}`);
    }
  }
});

test("every repo of the portfolio areas appears exactly once; apps once, in manifest order", { skip: !sources }, () => {
  const codes = new Set(areas.areas.map((a) => a.code));
  const want = registry.repos.filter((r) => codes.has(r.area_code)).map((r) => r.name).sort();
  const seen = areas.areas.flatMap((a) => [...a.home, ...a.projects.flatMap((p) => [...p.home, ...p.cards.flatMap((c) => c.repos)])]).map((r) => r.name);
  assert.equal(new Set(seen).size, seen.length, "no repo twice");
  assert.deepEqual([...seen].sort(), want, "every repo of the kept areas once");
  for (const a of areas.areas) for (const p of a.projects) assert.equal(p.repos, p.home.length + p.cards.reduce((n, c) => n + c.repos.length, 0), `${p.name}: repo count`);
  const apps = { ...sources.apps };
  for (const r of registry.repos) if (r.apps?.length) apps[r.name] = r.apps;
  for (const [repo, list] of Object.entries(apps)) {
    const holders = areas.areas.flatMap((a) => a.projects.flatMap((p) => p.cards.flatMap((c) => c.repos))).filter((r) => r.name === repo);
    assert.equal(holders.length, 1, `${repo} listed once`);
    assert.deepEqual(holders[0].apps.map((x) => x.name), list.map((x) => x.name), `${repo}: every declared app once, in manifest order`);
  }
});

test("owner's outline: 1 Unix (1.1 Cloudy families, 1.2 Cloud-Me Pub/Pvt), 2 CG, 3 Capital and 4 HardTech with area homes", () => {
  const area = (f) => areas.areas.find((a) => a.field === f);
  const proj = (f, n) => area(f)?.projects.find((p) => p.name === n);
  assert.deepEqual(areas.areas.slice(0, 4).map((a) => `${a.code} ${a.field}`), ["1 Unix", "2 CG", "3 Capital", "4 HardTech"]);
  const cloudy = proj("Unix", "Cloudy");
  assert.equal(cloudy.code, "1.1");
  assert.ok(cloudy.home.some((r) => r.hub), "Cloudy home card carries its hub");
  assert.deepEqual(cloudy.cards.map((c) => `${c.code} ${c.name}`), ["1.1.1 Android", "1.1.2 C3", "1.1.3 DB", "1.1.4 Desktop", "1.1.5 Docs", "1.1.6 Linux", "1.1.7 Webapps"]);
  const android = cloudy.cards[0].repos.find((r) => r.name === "cloudy-u-android");
  assert.ok(android?.apps?.length >= 10, "Android card lists the fleet apps");
  for (const a of android.apps) assert.match(a.url, /^https:\/\/github\.com\/diegonmarcos\/cloudy-u-android\/tree\/main\/[\w.-]+$/);
  const me = proj("Unix", "Cloud-Me");
  assert.equal(me.code, "1.2");
  assert.deepEqual(me.cards.map((c) => `${c.code} ${c.kind} ${c.name}`), ["1.2.1 subcategory Pub", "1.2.2 subcategory Pvt"]);
  assert.ok(me.cards.every((c) => c.repos.every((r) => r.family)), "Pub/Pvt repos grouped by family");
  assert.deepEqual(area("CG").projects.map((p) => p.name), ["Galaxy", "Zirkus"]);
  assert.deepEqual(proj("CG", "Zirkus").cards.map((c) => c.name), ["Production"]);
  const fin = area("Capital");
  assert.ok(fin.home.some((r) => r.name === "Fin-___" && r.hub), "3.0 Capital area home carries Fin-___");
  assert.deepEqual(fin.projects.map((p) => `${p.code} ${p.name}`), ["3.1 Macro-Central-Bank", "3.2 Micro-Asset-Management", "3.3 Stack-Fin-Terminal"]);
  const hard = area("HardTech");
  assert.ok(hard.home.some((r) => r.name === "DeepSc-___" && r.hub), "4.0 HardTech area home carries DeepSc-___");
  assert.deepEqual(hard.projects.map((p) => `${p.code} ${p.name}`), ["4.1 Structural", "4.2 DeepXTech", "4.3 Stack-CAD-Simulators"]);
  const st = proj("HardTech", "Structural");
  assert.equal(st.planned, true, "4.1 Structural is planned");
  assert.equal(st.repos, 0); assert.deepEqual(st.cards, []); assert.deepEqual(st.home, []);
  assert.equal(st.url, "https://github.com/diegonmarcos/CAD-Simulators/tree/main/Structural-Designer", "planned card links its content folder");
  assert.ok(!hard.projects.some((p) => p !== st && p.planned), "only Structural is planned");
  for (const a of areas.areas) {
    assert.match(a.code, /^\d+$/);
    for (const p of a.projects) {
      assert.ok(p.icon && p.brief, `${p.name}: icon and brief`);
      assert.match(p.code, new RegExp(`^${a.code}\\.\\d+$`), `${p.name} code under ${a.code}`);
      assert.ok(p.cards.length || p.home.length || p.planned, `${p.name}: a home card with content or a planned badge`);
    }
  }
});

test("private repos by name with a lock only: no URL, no contents; no archived repo; private-only projects have no link", () => {
  if (registry) for (const r of registry.repos.filter((x) => x.visibility !== "public")) assert.ok(!committed.includes(r.url), `private repo URL ${r.url} absent`);
  assert.ok(!committed.includes("z-archived_"));
  for (const a of areas.areas) for (const p of a.projects) {
    if (p.private_only) assert.equal(p.url, null, `${p.name} has no link`);
    else if (p.planned && !p.url) assert.equal(p.cards.length, 0);
    else assert.match(p.url, /^https:\/\/github\.com\/diegonmarcos\//);
    for (const r of [...p.home, ...p.cards.flatMap((c) => c.repos)]) if (r.private) {
      assert.deepEqual(Object.keys(r).filter((k) => k !== "family" && k !== "hub").sort(), ["name", "private"], `${r.name}: name and lock only`);
    }
  }
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
    assert.match(src, /import \{ slideCard \} from '\.\/card'/, `${name} uses slideCard`);
    assert.match(src, /import \{ el \} from '\.\.\/utils\/dom'/, `${name} uses the one el()`);
    assert.doesNotMatch(src, /function el\b|function featuredImg|class: 'link-section'|'link-section'/, `${name}: no own card shell`);
  }
  assert.match(ts, /refreshCarousel\('areas', \(\) => \{/, "Areas re-mounts the shared carousel on project change");
  assert.doesNotMatch(scss, /scroll-snap-stop|\.area-card|swiper-slide|link-section|featured-image/, "no Areas card/swipe styles");
  assert.match(shared, /\.carousel-row > \.swiper \{/, "one swiper rule for every section");
});

test("every Areas project has a card image (own asset, else area banner, else the xProjects default)", () => {
  for (const a of areas.areas) for (const p of a.projects) {
    assert.match(p.banner, /^public\/images\/banners\/[\w.-]+\.(gif|webp|jpg|png)$/, `${p.name} banner`);
    assert.ok(fs.existsSync(path.join(root, "src", p.banner)), `${p.banner} exists`);
  }
});
