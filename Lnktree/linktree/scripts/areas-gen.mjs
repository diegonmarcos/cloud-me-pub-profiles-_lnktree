#!/usr/bin/env node
// Build-time generator for the linktree Areas section (#1277, #1281, #1293).
// Source of truth: repos-github.json in _git-repos-master (generated there from repos.v3.json). Its `areas[]` outline
// is area -> project -> (subcategory ->) family -> repos, every node with a code (1, 1.1, 1.1.1, ...), label, icon,
// banner, description and hub repo; `repos[]` carries each repo's url, visibility, description and apps. The only
// other source is the declared app list of an app-fleet repo that does not carry `apps` itself (APP_MANIFESTS).
// Output: src/data/areas.json (data_wrap turns it into data-areas.json.js; esbuild inlines it into script.js).
//
// Outline -> cards (the owner's numbered outline, codes shown on every card and index chip):
//   area   N       an area HOME card (code N.0) when the area has its own hub repo (flat areas like Financial);
//   project N.M    a project HOME card (code N.M.0: brief, hub, link, the list of its families/sub-categories),
//                  then one card per child in outline order:
//   family N.M.K   its repos (and, for app-fleet repos, their declared apps);
//   subcat N.M.K   its families' repos grouped by family (Cloud-Me Pub / Pvt).
// Areas Others and Archived are not portfolio areas and are left out. Private repos appear by name with a lock: no
// URL, no contents. A project's link is its public hub, else its first public repo.
//
// Usage: node scripts/areas-gen.mjs            generate ($REPOS_GITHUB_JSON / $AREAS_APPS_DIR override the network
//                                              sources with local files)
//        node scripts/areas-gen.mjs --check    exit 1 when src/data/areas.json differs from the sources
// On a fetch error in generate mode the committed areas.json is kept (the build never breaks on a GitHub outage);
// tests/areas.test.mjs fails in CI when the sources are unreachable, so a stale file cannot ship unnoticed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/areas.json");
const OWNER = "diegonmarcos";
const REGISTRY_URL = `https://raw.githubusercontent.com/${OWNER}/_git-repos-master/main/repos-github.json`;
// repo -> declared app list (path in that repo, schema apk-manifest/v1: apps[].{name,module,description}).
export const APP_MANIFESTS = { "cloudy-u-android": "2_configs/apk-manifest.json" };

export const SKIP_AREAS = ["Others", "Archived"];
// Card image, same mechanism as xProjects (a banner asset per card): public/images/banners/<project-slug>.{gif,webp,jpg,png}
// when the project has its own asset, else the area banner, else repos.gif (the xProjects Repos card banner, the default).
export const BANNER_DIR = "public/images/banners";
export const DEFAULT_BANNER = `${BANNER_DIR}/repos.gif`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const exists = (rel) => !!rel && fs.existsSync(path.join(root, "src", rel));
export function bannerFor(project, fieldBanner) {
  for (const ext of ["gif", "webp", "jpg", "png"]) {
    const rel = `${BANNER_DIR}/${slug(project)}.${ext}`;
    if (exists(rel)) return rel;
  }
  return exists(fieldBanner) ? fieldBanner : DEFAULT_BANNER;
}
function entry(r, apps, extra = {}) {
  if (r.visibility !== "public") return { name: r.name, private: true, ...extra };
  const e = { name: r.name, url: r.url, ...extra };
  const list = r.apps?.length ? r.apps : apps[r.name];
  if (list) e.apps = list.map((a) => ({ name: a.name, url: a.url || `${r.url}/tree/main/${a.module}`, ...(a.description ? { description: a.description.trim() } : {}) }));
  return e;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// sources: { registry, apps: {repo: apps[]} }
export function deriveAreas({ registry, apps = {} }) {
  if (!Array.isArray(registry.areas)) throw new Error("repos-github.json has no areas[] outline");
  const byName = new Map(registry.repos.map((r) => [r.name, r]));
  const repo = (name, extra) => {
    const r = byName.get(name);
    if (!r) throw new Error(`outline lists unknown repo ${name}`);
    return entry(r, apps, extra);
  };
  const hubOf = (node, extra = {}) => (node.hub && byName.has(node.hub) ? [repo(node.hub, { hub: true, ...extra })] : []);
  const describe = (node, hub) => node.description || (hub && byName.get(hub.name)?.description) || "";
  const areas = [];
  for (const a of registry.areas) {
    if (SKIP_AREAS.includes(a.name)) continue;
    const areaBanner = `${BANNER_DIR}/${a.banner || "repos.gif"}`;
    const projects = [];
    for (const p of a.children || []) {
      const home = hubOf(p);
      const cards = (p.children || []).map((c) => c.kind === "subcategory"
        ? { code: c.code, name: c.label || c.name, kind: "subcategory", brief: describe(c, hubOf(c)[0]),
            repos: [...hubOf(c, { family: c.label || c.name }),
              ...(c.children || []).flatMap((f) => [...hubOf(f, { family: f.label || f.name }), ...(f.repos || []).map((n) => repo(n, { family: f.label || f.name }))])] }
        : { code: c.code, name: c.label || c.name, kind: "family", brief: describe(c, hubOf(c)[0]),
            repos: [...hubOf(c), ...(c.repos || []).map((n) => repo(n))] });
      const all = [...home, ...cards.flatMap((c) => c.repos)];
      const pub = all.filter((r) => !r.private);
      const target = home.find((r) => !r.private) || pub[0] || null;
      const kinds = cards.some((c) => c.kind === "subcategory") ? ["sub-category", "sub-categories"] : ["family", "families"];
      projects.push({
        code: p.code, name: p.label || p.name, icon: p.icon || a.icon, banner: bannerFor(p.name, areaBanner),
        brief: describe(p, target) || `${a.label || a.name} project: ${plural(cards.length, ...kinds)}, ${plural(all.length, "repo", "repos")}.`,
        repos: all.length, public: pub.length, url: target ? target.url : null, private_only: !target, home, cards,
      });
    }
    const home = hubOf(a);
    const target = home.find((r) => !r.private) || null;
    areas.push({
      code: a.code, field: a.label || a.name, icon: a.icon, banner: exists(areaBanner) ? areaBanner : DEFAULT_BANNER,
      brief: describe(a, target) || `${plural(projects.length, "project", "projects")}.`,
      url: target ? target.url : null, home, projects,
    });
  }
  return {
    _doc: "GENERATED by scripts/areas-gen.mjs from the _git-repos-master/repos-github.json areas[] outline and app manifests (#1277, #1281, #1293). DO NOT EDIT BY HAND.",
    section: { id: "areas", title: "Areas" },
    areas,
  };
}

async function getJson(url) {
  const headers = { "User-Agent": "linktree-areas-gen", ...(process.env.GITHUB_TOKEN && url.startsWith("https://api.github.com/") ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

export async function loadSources() {
  const registry = process.env.REPOS_GITHUB_JSON ? JSON.parse(fs.readFileSync(process.env.REPOS_GITHUB_JSON, "utf8")) : await getJson(REGISTRY_URL);
  const apps = {};
  for (const [repo, file] of Object.entries(APP_MANIFESTS)) {
    if (registry.repos.find((r) => r.name === repo)?.apps?.length) continue; // the registry carries them
    const m = process.env.AREAS_APPS_DIR
      ? JSON.parse(fs.readFileSync(path.join(process.env.AREAS_APPS_DIR, `${repo}.json`), "utf8"))
      : await getJson(`https://raw.githubusercontent.com/${OWNER}/${repo}/main/${file}`);
    if (!Array.isArray(m.apps) || !m.apps.length) throw new Error(`${repo}/${file}: empty app list`);
    apps[repo] = m.apps;
  }
  return { registry, apps };
}

export const serialize = (data) => JSON.stringify(data, null, 2) + "\n";

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes("--check");
  let sources;
  try { sources = await loadSources(); }
  catch (e) {
    if (check) { console.error(`areas-gen: cannot read sources: ${e.message}`); process.exit(1); }
    console.warn(`areas-gen: sources unavailable (${e.message}); keeping the committed areas.json`);
    process.exit(0);
  }
  const next = serialize(deriveAreas(sources));
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (check) {
    if (cur !== next) { console.error("areas-gen: src/data/areas.json is stale; run node scripts/areas-gen.mjs"); process.exit(1); }
    console.log("areas-gen: areas.json matches the sources");
  } else {
    if (cur !== next) fs.writeFileSync(OUT, next);
    const d = JSON.parse(next);
    const n = d.areas.reduce((a, f) => a + f.projects.length, 0);
    console.log(`areas-gen: ${n} project(s) in ${d.areas.length} area(s)${cur === next ? " (unchanged)" : " (written)"}`);
  }
}
