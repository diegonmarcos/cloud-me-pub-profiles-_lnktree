// #1277 Areas section: placement and registry coverage. Dependency-free (node:test), run by the build
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

test("Areas section sits between Profiles and Projects", () => {
  const prof = html.indexOf('class="section-box professional-profiles-section"');
  const area = html.indexOf('class="section-box areas-section"');
  const proj = html.indexOf('class="section-box projects-section"');
  assert.ok(prof >= 0 && area >= 0 && proj >= 0, "all three sections exist");
  assert.ok(prof < area && area < proj, "order: Profiles < Areas < Projects");
  assert.equal(html.split('class="section-box areas-section"').length, 2, "exactly one Areas section");
  assert.match(html.slice(area, proj), /data-areas-row/, "Areas section has the render mount");
});

test("areas.json is exactly what the registry derives (no drift)", () => {
  assert.equal(committed, serialize(deriveAreas(registry)));
});

test("every registry project is listed exactly once", () => {
  const meta = (r) => ["profile", "deployer"].includes(r.role) || r.family === "Master";
  const expected = new Set();
  for (const r of registry.repos) {
    if (r.name.startsWith("z-archived_") || r.project === "—" || r.field === "—" || meta(r)) continue;
    expected.add(`${r.field}/${r.project}`);
  }
  const listed = areas.areas.flatMap((a) => a.projects.map((p) => `${a.field}/${p.name}`));
  assert.equal(new Set(listed).size, listed.length, "no project listed twice");
  assert.deepEqual([...listed].sort(), [...expected].sort());
  const names = areas.areas.flatMap((a) => a.projects.map((p) => p.name));
  assert.equal(new Set(names).size, names.length, "project names unique across areas");
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
  }
});
