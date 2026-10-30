#!/usr/bin/env node
// Build-time generator for the linktree Areas section (#1277, #1281, #1293, #1308).
// Source of truth: 0_registry/repos-github.json in _git-repos-master (generated there from repos.v3.json). Its `areas[]` outline
// is area -> project -> (subcategory ->) family -> repos, every node with a code (1, 1.1, 1.1.1, ...), label, icon,
// banner, description and hub repo; `repos[]` carries each repo's url, visibility, description and apps. The only
// other source is the declared app list of an app-fleet repo that does not carry `apps` itself (APP_MANIFESTS).
// Output: src/data/areas.json (data_wrap turns it into data-areas.json.js; esbuild inlines it into script.js).
//
// Outline -> cards (#1308): EVERY card is an xProjects tools slide (projects.json kind "tools"), rendered by
// portal-render.ts renderToolsSlide: banner, title with its outline code, columns = application categories, links =
// applications (icon + short label + url where the app runs or lives). No repo lists, no long descriptions.
//   area   N       area HOME card (N.0) when the area has a hub: one column per project, its top apps;
//   project N.M    project HOME card (N.M.0): one column per family, its top apps; then one card per child:
//   family N.M.K   app-fleet repos: the declared app manifest by category; other repos: their folder tree
//                  (registry 0_repo-folders-tree) grouped by parent folder / prefix; children (sub-families,
//                  sub-category families) become one column each.
// Categories, order, icons and folder rules: scripts/areas-taxonomy.json (data). Private repos: label + lock, no URL.
// Sources: 0_registry/repos-github.json, 0_repo-folders-tree/repo-folders-tree.json ($AREAS_TREE_JSON), app manifests.
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
const REGISTRY_URL = `https://raw.githubusercontent.com/${OWNER}/_git-repos-master/main/0_registry/repos-github.json`;
const TREE_URL = `https://raw.githubusercontent.com/${OWNER}/_git-repos-master/main/0_repo-folders-tree/repo-folders-tree.json`;
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
export const TAXONOMY = JSON.parse(fs.readFileSync(path.join(root, "scripts/areas-taxonomy.json"), "utf8"));
const T = TAXONOMY;
const clip = (s) => (s.length > T.label_max ? s.slice(0, T.label_max - 1) + "…" : s);
const titleCase = (s) => s.split(/[-_ ]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const RULES = T.app_icons.rules.map(([re, icon]) => [new RegExp(re, "i"), icon]);
export function iconFor(name, category) {
  for (const [re, icon] of RULES) if (re.test(name)) return icon;
  return T.category_icons[category] || T.fallback_icon;
}
const repoLabel = (name) => clip(name.replace(new RegExp(T.folders.repo_label_strip), "").replace(/^[-_]+/, "") || name);

// Android: the declared app list grouped by the taxonomy's categories (order = declaration order, OTHER last).
export function androidColumns(repo, apps) {
  const A = T.android, cats = Object.keys(A.categories);
  const catOf = (n) => cats.find((c) => A.categories[c].includes(n)) || "OTHER";
  const cols = new Map([...cats, "OTHER"].map((c) => [c, []]));
  for (const a of apps) {
    const cat = catOf(a.name);
    const slug = a.web?.portal_slug;
    const label = clip(A.labels[a.name] || titleCase(a.name.replace(/^cloud-/, "")));
    cols.get(cat).push({ label, url: slug ? A.web_url.replace("{slug}", slug) : a.url || `${repo.url}/tree/main/${a.module}`, icon: iconFor(label, cat) });
  }
  return [...cols].filter(([, l]) => l.length).map(([header, links]) => ({ header, links }));
}

// Any other repo: its folder tree (registry) -> [{group, label, path}], see taxonomy folders._doc.
const SKIP = new RegExp(T.folders.skip, "i"), PREFIX = new RegExp(T.folders.prefix);
const dirs = (entries) => (entries || []).filter((e) => e.type === "dir" && !SKIP.test(e.name));
export function folderApps(entries) {
  const out = [];
  const visit = (list, base) => {
    for (const d of dirs(list)) {
      const p = base ? `${base}/${d.name}` : d.name;
      if (T.folders.containers.includes(d.name)) { visit(d.children, p); continue; }
      const m = d.name.match(PREFIX);
      const kids = dirs(d.children).filter((k) => !T.folders.containers.includes(k.name));
      if (!m && kids.length && /^[A-Z]/.test(d.name)) { for (const k of kids) out.push({ group: d.name, name: k.name.replace(PREFIX, ""), path: `${p}/${k.name}` }); continue; }
      out.push({ group: m && m[1].length > 2 ? (T.folders.prefix_columns[m[1].toLowerCase()] || m[1].toUpperCase()) : null, name: d.name.replace(PREFIX, ""), path: p });
    }
  };
  visit(entries, "");
  return out;
}

function repoColumns(r, ctx) {
  const header = repoLabel(r.name).toUpperCase();
  if (r.visibility !== "public") return [{ header: null, links: [{ label: repoLabel(r.name), url: T.private_url, icon: T.private_icon }] }];
  const declared = r.apps?.[0]?.module ? r.apps : ctx.apps[r.name];
  if (declared) return androidColumns(r, declared);
  const taken = ctx.claimed?.get(r.name) || [];
  const found = folderApps(ctx.trees[r.name]).filter((a) => !taken.some((t) => a.path === t || t.startsWith(`${a.path}/`) || a.path.startsWith(`${t}/`)));
  if (!found.length) return [{ header: null, links: [{ label: repoLabel(r.name), url: r.url, icon: T.repo_icon }] }];
  const cols = new Map();
  for (const a of found) {
    const h = (a.group || header).replace(/[-_]+/g, " ").trim().toUpperCase();
    if (!cols.has(h)) cols.set(h, []);
    cols.get(h).push({ label: clip(a.name), url: `${r.url}/tree/main/${a.path}`, icon: iconFor(a.name, h) });
  }
  return [...cols].map(([h, links]) => ({ header: h, links }));
}

// Merge columns with the same header; when there are more than max_columns, fold the smallest into OTHERS.
function tidy(cols) {
  const by = new Map();
  for (const c of cols) { if (!by.has(c.header)) by.set(c.header, { header: c.header, links: [] }); const e = by.get(c.header); e.links.push(...c.links); if (c.keep) e.keep = true; }
  let out = [...by.values()];
  if (out.length > T.max_columns) {
    // sub-family columns always stay; the largest of the rest fill the remaining slots
    const keep = [...out].sort((a, b) => (b.keep ? 1e6 : b.links.length) - (a.keep ? 1e6 : a.links.length)).slice(0, T.max_columns - 1);
    const rest = out.filter((c) => !keep.includes(c));
    out = [...out.filter((c) => keep.includes(c)), { header: "OTHERS", links: rest.flatMap((c) => c.links) }];
  }
  return out.map(({ keep, ...c }, i) => ({ ...c, row: Math.floor(i / T.columns_per_row) }));
}

// The tools slide (projects.json kind "tools" schema) of one card.
function slide(id, code, title, banner, columns, data, tagline) {
  return { id, kind: "tools", code, title, image: { src: banner, alt: title }, ...(tagline ? { tagline } : {}), columns: tidy(columns), data: { ...data, code } };
}
const overview = (header, cols) => ({ header: header.toUpperCase(), links: cols.flatMap((c) => c.links).slice(0, T.home_links_per_column) });

// "Repo/path" mention of a public registry repo in a description -> its folder URL (null when none).
function contentUrl(text, byName) {
  for (const m of (text || "").matchAll(/([\w.-]+)\/([\w./-]*\w)/g)) {
    const r = byName.get(m[1]);
    if (r && r.visibility === "public" && r.url) return `${r.url}/tree/main/${m[2]}`;
  }
  return null;
}

// sources: { registry, apps: {repo: apps[]}, trees: {repo: entries[]} }
export function deriveAreas({ registry, apps = {}, trees = {} }) {
  if (!Array.isArray(registry.areas)) throw new Error("repos-github.json has no areas[] outline");
  const byName = new Map(registry.repos.map((r) => [r.name, r]));
  const ctx = { apps, trees, claimed: null };
  // Content families (#1308): no repos, `content.repo` + `apps[{name,path}]` -> links into that repo's folders. Their
  // paths are claimed: the host repo's own card does not list them again.
  const claimed = new Map();
  const claim = (n) => { if (n.content?.repo) for (const a of n.apps || []) { if (!claimed.has(n.content.repo)) claimed.set(n.content.repo, []); claimed.get(n.content.repo).push(a.path); } (n.children || []).forEach(claim); };
  registry.areas.forEach(claim);
  ctx.claimed = claimed;
  const contentCols = (n) => {
    const r = n.content?.repo && byName.get(n.content.repo);
    if (!r || !n.apps?.length) return [];
    return [{ header: (n.label || n.name).toUpperCase(), links: n.apps.map((a) => ({ label: clip(a.name), url: r.visibility === "public" ? `${r.url}/tree/main/${a.path}` : T.private_url, icon: iconFor(a.name, "OTHER") })) }];
  };
  const reposOf = (node) => [...(node.hub ? [node.hub] : []), ...(node.repos || []), ...(node.children || []).flatMap(reposOf)];
  // A repo that is a single app (private, or no kept folder) goes in a column named after its family (`header`).
  const colsOf = (names, header) => names.map((n) => { const r = byName.get(n); if (!r) throw new Error(`outline lists unknown repo ${n}`); return repoColumns(r, ctx); }).flat()
    .map((c) => (c.header ? c : { ...c, header: header.toUpperCase() }));
  const areas = [];
  for (const a of registry.areas) {
    if (SKIP_AREAS.includes(a.name)) continue;
    const field = a.label || a.name;
    const areaBanner = `${BANNER_DIR}/${a.banner || "repos.gif"}`;
    const projects = [];
    for (const p of a.children || []) {
      const name = p.label || p.name, banner = bannerFor(p.name, areaBanner);
      const families = (p.children || []).map((c) => {
        const cname = c.label || c.name;
        // sub-category: one column group per family; family: its repos' columns.
        // A node with children (sub-category, or a family with sub-families): its own repos' columns, then one column
        // per child holding that child's apps. A plain family: its repos' columns.
        const cols = c.children?.length
          ? [...contentCols(c), ...colsOf([...(c.hub ? [c.hub] : []), ...(c.repos || [])], cname), ...c.children.map((f) => ({ keep: true, header: (f.label || f.name).toUpperCase(),
              links: [...contentCols(f).flatMap((x) => x.links), ...colsOf(reposOf(f), cname).flatMap((x) => x.links)] }))]
          : [...contentCols(c), ...colsOf(reposOf(c), cname)];
        return slide(`area-${c.code}`, c.code, cname, banner, cols, { kind: c.kind, card: cname, project: name, field });
      });
      const all = reposOf(p);
      const planned = all.length === 0 && families.length === 0;
      const content = planned ? contentUrl(p.description, byName) : null;
      const homeCols = planned
        ? [{ header: "PLANNED", links: [{ label: clip(content ? content.split("/").pop() : name), url: content || T.private_url, icon: iconFor(name, "OTHER") }] }]
        : families.length ? families.map((f) => overview(f.title, f.columns)) : colsOf(all, name);
      const home = slide(`area-${p.code}.0`, `${p.code}.0`, `${p.icon || a.icon} ${name}`, banner, homeCols, { kind: "home", card: name, project: name, field }, planned ? "planned" : undefined);
      projects.push({ code: p.code, name, icon: p.icon || a.icon, repos: all.length, ...(planned ? { planned: true } : {}), cards: [home, ...families] });
    }
    const banner = exists(areaBanner) ? areaBanner : DEFAULT_BANNER;
    const home = a.hub ? slide(`area-${a.code}.0`, `${a.code}.0`, `${a.icon} ${field}`, banner,
      projects.map((p) => overview(p.name, p.cards[0].columns)), { kind: "area", card: field, project: "#area", field }) : null;
    areas.push({ code: a.code, field, icon: a.icon, banner, home, projects });
  }
  return {
    _doc: "GENERATED by scripts/areas-gen.mjs from the _git-repos-master registry (0_registry/repos-github.json areas[] outline, 0_repo-folders-tree), the cloudy-u-android app manifest and scripts/areas-taxonomy.json (#1277, #1293, #1308). Every card is an xProjects kind:\"tools\" slide. DO NOT EDIT BY HAND.",
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
    apps[repo] = m.apps.map((a) => ({ name: a.name, module: a.module, ...(a.web?.portal_slug ? { web: { portal_slug: a.web.portal_slug } } : {}) }));
  }
  const ft = process.env.AREAS_TREE_JSON ? JSON.parse(fs.readFileSync(process.env.AREAS_TREE_JSON, "utf8")) : await getJson(TREE_URL);
  const trees = {};
  const walk = (n) => { if (n.entries && n.name) trees[n.name] = n.entries; for (const c of n.children || []) walk(c); };
  walk(ft.tree);
  return { registry, apps, trees };
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
