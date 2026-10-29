#!/usr/bin/env node
// Build-time generator for the linktree Areas section (#1277, #1281, #1293).
// Sources of truth, all fetched at build time (no hand-typed project or app list):
//   - registry: repos-github.json in _git-repos-master (Field / Project / subcategory / Family of every repo);
//   - briefs:   the GitHub description of each project's link target (repos/<owner>/<name>);
//   - apps:     declared app lists of app-fleet repos (cloudy-u-android 2_configs/apk-manifest.json).
// Output: src/data/areas.json (data_wrap turns it into data-areas.json.js; esbuild inlines it into script.js).
//
// Rules:
//   - one area per Field, one project per Project, in registry order of first appearance;
//   - excluded repos: z-archived_*, role profile/deployer, family Master, project or field "—";
//   - each project = one home card (brief, banner, hub link, repo count; carries the project-level Hub repos)
//     then one card per sub-category when the project uses sub-categories, else one card per family;
//     repos without a sub-category in a sub-category project get a card per family;
//   - a repo listed in APP_MANIFESTS also lists its declared apps (name, link to the module, description);
//   - link: the project's public hub, else its first public repo; private-only projects have no link;
//   - private repos appear by name with a lock: no URL, no contents.
//
// Usage: node scripts/areas-gen.mjs            generate ($REPOS_GITHUB_JSON / $AREAS_REPOS_JSON / $AREAS_APPS_DIR
//                                              override the network sources with local files)
//        node scripts/areas-gen.mjs --check    exit 1 when src/data/areas.json differs from the sources
// On a fetch error in generate mode the committed areas.json is kept (the build never breaks on a GitHub outage).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/areas.json");
const OWNER = "diegonmarcos";
const REGISTRY_URL = `https://raw.githubusercontent.com/${OWNER}/_git-repos-master/main/repos-github.json`;
// repo -> declared app list (path in that repo, schema apk-manifest/v1: apps[].{name,module,description}).
export const APP_MANIFESTS = { "cloudy-u-android": "2_configs/apk-manifest.json" };

// Presentation only: emoji + banner image per field (unknown fields get the defaults).
const FIELD_STYLE = {
  Unix: ["🐧", "cloud.gif"], CG: ["🎮", "circus.gif"], Financial: ["💹", "nexus.webp"],
  "Deep Science": ["🔬", "structural.gif"], 42: ["🎓", "repos.gif"], Front: ["🎨", "lab-tools.gif"],
};
const DEFAULT_STYLE = ["📁", "repos.gif"];
// Presentation only: project index icons (unknown projects get the area icon).
const PROJECT_ICON = {
  Cloudy: "☁️", "Cloud-Me": "🙋", Galaxy: "🌌", Zirkus: "🎪", "Fin-CM": "📈", "DeepSc-X": "🧬", "CAD-Simulators": "📐",
  Endeavours: "🚀", Labtools: "🧪", "42-algo": "🧮", "42-graphic": "🖼️", "42-mylibs": "📚", "42-projects": "🗂️",
  "42-system": "⚙️", "42-agentic": "🤖", "42-datascience": "📊", "42-machinelearning": "🧠", "42-cyberwarfare": "🛡️", "42-dev": "💻",
};
const NONE = "—";

export function isExcluded(r) {
  return r.name.startsWith("z-archived_") || ["profile", "deployer"].includes(r.role) || r.family === "Master" ||
    !r.project || r.project === NONE || !r.field || r.field === NONE;
}

const isHub = (r) => r.role === "hub" || r.family === "Hub";

function entry(r, apps) {
  if (r.visibility !== "public") return { name: r.name, private: true };
  const e = { name: r.name, url: r.url, ...(isHub(r) ? { hub: true } : {}) };
  const list = apps[r.name];
  if (list) e.apps = list.map((a) => ({ name: a.name, url: `${r.url}/tree/main/${a.module}`, ...(a.description ? { description: a.description.trim() } : {}) }));
  return e;
}

// sources: { registry, descriptions: {repo: text}, apps: {repo: apps[]} }
export function deriveAreas({ registry, descriptions = {}, apps = {} }) {
  const fields = new Map();
  for (const r of registry.repos) {
    if (isExcluded(r)) continue;
    if (!fields.has(r.field)) fields.set(r.field, new Map());
    const projects = fields.get(r.field);
    if (!projects.has(r.project)) projects.set(r.project, []);
    projects.get(r.project).push(r);
  }
  const areas = [];
  for (const [field, projects] of fields) {
    const [icon, banner] = FIELD_STYLE[field] || DEFAULT_STYLE;
    const list = [];
    for (const [name, repos] of projects) {
      const pub = repos.filter((r) => r.visibility === "public");
      const target = pub.find(isHub) || pub[0] || null;
      const bySub = repos.some((r) => r.subcategory);
      const home = [];
      const cards = [];
      for (const r of repos) {
        if (!r.subcategory && r.family === "Hub") { home.push(entry(r, apps)); continue; }
        const key = r.subcategory || r.family;
        let card = cards.find((c) => c.name === key);
        if (!card) cards.push(card = { name: key, kind: r.subcategory ? "subcategory" : "family", repos: [] });
        card.repos.push({ ...entry(r, apps), ...(card.kind === "subcategory" ? { family: r.family } : {}) });
      }
      const brief = (target && descriptions[target.name]) || `${field} project: ${cards.length} ${bySub ? "sub-categor" + (cards.length === 1 ? "y" : "ies") : "famil" + (cards.length === 1 ? "y" : "ies")}, ${repos.length} repo${repos.length === 1 ? "" : "s"}.`;
      list.push({
        name, icon: PROJECT_ICON[name] || icon, brief, repos: repos.length, public: pub.length,
        url: target ? target.url : null, private_only: !target, home, cards,
      });
    }
    areas.push({ field, icon, banner: `public/images/banners/${banner}`, projects: list });
  }
  return {
    _doc: "GENERATED by scripts/areas-gen.mjs from _git-repos-master/repos-github.json, project repo descriptions and app manifests (#1277, #1281, #1293). DO NOT EDIT BY HAND.",
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
  // briefs: the GitHub description of each project's link target (its public hub, else its first public repo)
  const targets = deriveAreas({ registry }).areas.flatMap((a) => a.projects.map((p) => p.url)).filter(Boolean).map((u) => u.split("/").pop());
  const local = process.env.AREAS_REPOS_JSON ? JSON.parse(fs.readFileSync(process.env.AREAS_REPOS_JSON, "utf8")) : null;
  const descriptions = {};
  for (const name of targets) {
    const g = local ? local.find((x) => x.name === name) : await getJson(`https://api.github.com/repos/${OWNER}/${name}`);
    if (g && g.description) descriptions[name] = g.description.trim();
  }
  const apps = {};
  for (const [repo, file] of Object.entries(APP_MANIFESTS)) {
    const m = process.env.AREAS_APPS_DIR
      ? JSON.parse(fs.readFileSync(path.join(process.env.AREAS_APPS_DIR, `${repo}.json`), "utf8"))
      : await getJson(`https://raw.githubusercontent.com/${OWNER}/${repo}/main/${file}`);
    if (!Array.isArray(m.apps) || !m.apps.length) throw new Error(`${repo}/${file}: empty app list`);
    apps[repo] = m.apps;
  }
  return { registry, descriptions, apps };
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
