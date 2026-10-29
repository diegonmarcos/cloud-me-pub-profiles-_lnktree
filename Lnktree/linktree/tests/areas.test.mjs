// #1277/#1281/#1293 Areas: placement, registry + app-manifest coverage, card split and groupings. Dependency-free (node:test), run by the build
// (build.json npm step "areas") right after scripts/areas-gen.mjs regenerates src/data/areas.json.
//   node --test tests/areas.test.mjs        (registry: $REPOS_GITHUB_JSON path, else the raw GitHub URL)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveAreas, serialize, loadSources } from "../scripts/areas-gen.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const committed = fs.readFileSync(path.join(root, "src/data/areas.json"), "utf8");
const areas = JSON.parse(committed);
// Sources as the generator reads them; when GitHub is unreachable the generator kept the committed file, so the drift
// test is skipped and the structural tests still run against the registry snapshot carried by the committed data.
let sources = null, sourceError = "";
try { sources = await loadSources(); } catch (e) { sourceError = e.message; }
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
  assert.match(box, /data-cards-prev/); assert.match(box, /data-cards-next/);
  assert.match(html.slice(xp, html.indexOf("</section>", xp)), /<h2 class="box-title">xPROJECTS<\/h2>/, "old Projects renamed xProjects");
});

test("areas.json is exactly what the sources derive (no drift)", { skip: sources ? false : `sources unavailable: ${sourceError}` }, () => {
  assert.equal(committed, serialize(deriveAreas(sources)));
});

test("every registry project listed once; every repo, family and app appears exactly once", { skip: !sources }, () => {
  const skip = (r) => r.name.startsWith("z-archived_") || r.project === "—" || r.field === "—" || ["profile", "deployer"].includes(r.role) || r.family === "Master";
  const kept = registry.repos.filter((r) => !skip(r));
  const listed = areas.areas.flatMap((a) => a.projects.map((p) => `${a.field}/${p.name}`));
  assert.equal(new Set(listed).size, listed.length, "no project listed twice");
  assert.deepEqual([...listed].sort(), [...new Set(kept.map((r) => `${r.field}/${r.project}`))].sort());
  const seen = [];
  for (const a of areas.areas) for (const p of a.projects) {
    const mine = kept.filter((r) => r.field === a.field && r.project === p.name);
    const repos = [...p.home, ...p.cards.flatMap((c) => c.repos)];
    assert.equal(p.repos, repos.length, `${p.name}: repo count`);
    assert.deepEqual(repos.map((r) => r.name).sort(), mine.map((r) => r.name).sort(), `${p.name}: every repo once`);
    seen.push(...repos.map((r) => r.name));
    const names = p.cards.map((c) => c.name);
    assert.equal(new Set(names).size, names.length, `${p.name}: no card twice`);
    const bySub = mine.some((r) => r.subcategory);
    const expectCards = [...new Set(mine.filter((r) => r.subcategory || r.family !== "Hub").map((r) => r.subcategory || r.family))];
    assert.deepEqual(names, expectCards, `${p.name}: one card per ${bySub ? "sub-category" : "family"}`);
    for (const c of p.cards) for (const r of c.repos) {
      const src = mine.find((x) => x.name === r.name);
      assert.equal(c.name, src.subcategory || src.family, `${r.name} in its card`);
      if (c.kind === "subcategory") assert.equal(r.family, src.family);
    }
  }
  assert.equal(new Set(seen).size, seen.length, "no repo in two projects");
  for (const [repo, list] of Object.entries(sources.apps)) {
    const holders = areas.areas.flatMap((a) => a.projects.flatMap((p) => p.cards.flatMap((c) => c.repos))).filter((r) => r.name === repo);
    assert.equal(holders.length, 1, `${repo} listed once`);
    assert.deepEqual(holders[0].apps.map((x) => x.name), list.map((x) => x.name), `${repo}: every declared app once, in manifest order`);
    assert.equal(new Set(list.map((x) => x.name)).size, list.length);
  }
});

test("project cards (#1293): Cloudy families with Android apps, Cloud-Me Pub/Pvt, Fin-CM Corporate/Capital Markets", () => {
  const proj = (f, n) => areas.areas.find((a) => a.field === f)?.projects.find((p) => p.name === n);
  const cloudy = proj("Unix", "Cloudy");
  assert.ok(cloudy && cloudy.home.some((r) => r.hub), "Cloudy home card carries its hub");
  for (const f of ["Android", "Desktop", "C3", "Linux", "Docs", "Webapps", "DB"]) assert.ok(cloudy.cards.some((c) => c.name === f && c.kind === "family"), `Cloudy ${f} card`);
  const android = cloudy.cards.find((c) => c.name === "Android").repos.find((r) => r.name === "cloudy-u-android");
  assert.ok(android?.apps?.length >= 10, "Android card lists the fleet apps");
  for (const a of android.apps) assert.match(a.url, /^https:\/\/github\.com\/diegonmarcos\/cloudy-u-android\/tree\/main\/[\w.-]+$/);
  assert.deepEqual(proj("Unix", "Cloud-Me").cards.map((c) => c.name), ["Pub", "Pvt"]);
  assert.deepEqual(proj("Financial", "Fin-CM").cards.map((c) => c.name), ["Corporate", "Capital Markets"]);
  for (const a of areas.areas) for (const p of a.projects) {
    assert.ok(p.icon && p.brief, `${p.name}: icon and brief`);
    assert.ok(p.cards.length >= 1, `${p.name}: at least one family card`);
  }
});

test("groupings (#1281): Cloud-Me one project Pub/Pvt, Financial one project Fin-CM, 42 one area", () => {
  const fields = areas.areas.map((a) => a.field);
  for (const f of ["Finance", "Capital Markets", "Low Level", "Machine Learning", "Cybersecurity", "Dev"]) assert.ok(!fields.includes(f), `no area ${f}`);
  const proj = (f, n) => areas.areas.find((a) => a.field === f)?.projects.find((p) => p.name === n);
  const subs = (p) => p.cards.filter((c) => c.kind === "subcategory").map((c) => c.name);
  const cm = proj("Unix", "Cloud-Me");
  assert.ok(cm, "Cloud-Me project");
  assert.deepEqual(subs(cm), ["Pub", "Pvt"]);
  assert.ok(!areas.areas.some((a) => a.projects.some((p) => /^Cloud-Me-P/.test(p.name))), "no Cloud-Me-Pub/Pvt projects");
  const fin = areas.areas.find((a) => a.field === "Financial");
  assert.deepEqual(fin.projects.map((p) => p.name), ["Fin-CM"]);
  assert.deepEqual(subs(fin.projects[0]).sort(), ["Capital Markets", "Corporate"]);
  const school = areas.areas.find((a) => a.field === "42");
  assert.ok(school && school.projects.length > 0, "one 42 area");
  assert.ok(areas.areas.every((a) => a.field === "42" || a.projects.every((p) => !/^42-/.test(p.name))), "42 projects only in the 42 area");
});

test("private repos by name with a lock only: no URL, no contents; no archived repo; private-only projects have no link", () => {
  if (registry) for (const r of registry.repos.filter((x) => x.visibility !== "public")) assert.ok(!committed.includes(r.url), `private repo URL ${r.url} absent`);
  assert.ok(!committed.includes("z-archived_"));
  for (const a of areas.areas) for (const p of a.projects) {
    if (p.private_only) assert.equal(p.url, null, `${p.name} has no link`);
    else assert.match(p.url, /^https:\/\/github\.com\/diegonmarcos\//);
    for (const r of [...p.home, ...p.cards.flatMap((c) => c.repos)]) if (r.private) {
      assert.deepEqual(Object.keys(r).filter((k) => k !== "family").sort(), ["name", "private"], `${r.name}: name and lock only`);
    }
  }
});
