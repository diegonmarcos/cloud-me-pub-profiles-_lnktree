// #1277/#1281 Areas + Projects: placement, registry coverage and groupings. Dependency-free (node:test), run by the build
// (build.json npm step "areas") right after scripts/areas-gen.mjs regenerates src/data/areas.json.
//   node --test tests/areas.test.mjs        (registry: $REPOS_GITHUB_JSON path, else the raw GitHub URL)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveAreas, serialize } from "../scripts/areas-gen.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const committed = fs.readFileSync(path.join(root, "src/data/areas.json"), "utf8");
const areas = JSON.parse(committed);
const registry = process.env.REPOS_GITHUB_JSON
  ? JSON.parse(fs.readFileSync(process.env.REPOS_GITHUB_JSON, "utf8"))
  : await (await fetch("https://raw.githubusercontent.com/diegonmarcos/_git-repos-master/main/repos-github.json")).json();

test("section order: Profiles < Areas+Projects < Personal Profiles < xProjects", () => {
  const at = (c) => html.indexOf(`class="section-box ${c}"`);
  const prof = at("professional-profiles-section"), area = at("areas-section"), pers = at("personal-profiles-section"), xp = at("projects-section");
  assert.ok(prof >= 0 && area >= 0 && pers >= 0 && xp >= 0, "all four sections exist");
  assert.ok(prof < area && area < pers && pers < xp, "order");
  assert.equal(html.split('class="section-box areas-section"').length, 2, "exactly one Areas section");
  const box = html.slice(area, html.indexOf("</section>", area));
  assert.match(box, /data-areas-row/, "icon bar mount");
  assert.match(box, /data-area-projects/, "Projects cards mount directly below the icon bar");
  assert.ok(box.indexOf("data-areas-row") < box.indexOf("data-area-projects"));
  assert.match(html.slice(xp, html.indexOf("</section>", xp)), /<h2 class="box-title">xPROJECTS<\/h2>/, "old Projects renamed xProjects");
});

test("areas.json is exactly what the registry derives (no drift)", () => {
  assert.equal(committed, serialize(deriveAreas(registry)));
});

test("every registry project is listed exactly once, with every one of its repos", () => {
  const skip = (r) => r.name.startsWith("z-archived_") || r.project === "—" || r.field === "—" || ["profile", "deployer"].includes(r.role) || r.family === "Master";
  const expected = new Map();
  for (const r of registry.repos) if (!skip(r)) expected.set(`${r.field}/${r.project}`, (expected.get(`${r.field}/${r.project}`) || 0) + 1);
  const listed = areas.areas.flatMap((a) => a.projects.map((p) => `${a.field}/${p.name}`));
  assert.equal(new Set(listed).size, listed.length, "no project listed twice");
  assert.deepEqual([...listed].sort(), [...expected.keys()].sort());
  for (const a of areas.areas) for (const p of a.projects) {
    const n = p.subcategories.flatMap((s) => s.families.flatMap((f) => f.repos)).length;
    assert.equal(n, expected.get(`${a.field}/${p.name}`), `${p.name}: every repo once`);
    assert.equal(p.repos, n);
  }
});

test("groupings (#1281): Cloud-Me one project Pub/Pvt, Financial one project Fin-CM, 42 one area", () => {
  const fields = areas.areas.map((a) => a.field);
  for (const f of ["Finance", "Capital Markets", "Low Level", "Machine Learning", "Cybersecurity", "Dev"]) assert.ok(!fields.includes(f), `no area ${f}`);
  const proj = (f, n) => areas.areas.find((a) => a.field === f)?.projects.find((p) => p.name === n);
  const subs = (p) => p.subcategories.map((s) => s.name).filter(Boolean);
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

test("no private or archived repo leaks; private-only projects have no link", () => {
  const priv = registry.repos.filter((r) => r.visibility !== "public");
  for (const r of priv) {
    assert.ok(!committed.includes(`"${r.name}"`), `private repo name ${r.name} absent`);
    assert.ok(!committed.includes(r.url), `private repo URL ${r.url} absent`);
  }
  assert.ok(!committed.includes("z-archived_"));
  for (const a of areas.areas) for (const p of a.projects) {
    if (p.private_only) assert.equal(p.url, null, `${p.name} has no link`);
    else assert.match(p.url, /^https:\/\/github\.com\/diegonmarcos\//);
    for (const s of p.subcategories) for (const f of s.families) for (const r of f.repos) if (r.private) assert.deepEqual(Object.keys(r), ["private"]);
  }
});
