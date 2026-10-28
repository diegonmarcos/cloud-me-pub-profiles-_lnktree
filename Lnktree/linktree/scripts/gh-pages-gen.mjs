#!/usr/bin/env node
// Build-time generator for linktree /gh: every GitHub Pages site the owner publishes.
// Sources (all declarative, read from the checked-out monorepo):
//   - .github/workflows/ship.yml PROJECTS=( "path:deploy_name" ... )   the sites the monorepo deploys
//   - 1_front-configs/dist/front-data-projects.json                    display titles
//   - 1_front-configs/dist/_cloud-data-consolidated.json               custom domains (github_pages_proxies)
//   - <path>/dist/index.html                                           description (<meta name=description>)
//   - git log of <path> (dist/ excluded)                               last commit date
//   - GitHub API /users/<owner>/repos (has_pages) + /repos/<o>/<r>/pages  separate Pages repos
// Every URL is fetched; the HTTP status is recorded and broken ones are flagged, not hidden.
// Writes src/data/gh-pages.json (+ PORTAL_DATA wrapper, + dist copy). The page makes no API calls.
// Needs full git history (fetch-depth 0) for the commit dates.
// Usage: GH_TOKEN=... node scripts/gh-pages-gen.mjs [owner]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8" }).trim();
const owner = process.argv[2] || "diegonmarcos";
const monorepo = `${owner}.github.io`;
const base = `https://${owner}.github.io/`;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "linktree-gh-pages-gen" };
if (token) headers.Authorization = `Bearer ${token}`;

const readJson = (p, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(repoRoot, p), "utf8")); } catch { return fallback; } };
const git = (...a) => { try { return execFileSync("git", a, { cwd: repoRoot, encoding: "utf8" }).trim(); } catch { return ""; } };

// ---- monorepo sites -------------------------------------------------------------------
const ship = fs.readFileSync(path.join(repoRoot, ".github/workflows/ship.yml"), "utf8");
const block = ship.match(/PROJECTS=\(([\s\S]*?)\n\s*\)/);
if (!block) throw new Error("PROJECTS=( ... ) not found in ship.yml");
const entries = [...block[1].matchAll(/"([^"]+):([^":]*)"/g)].map((m) => ({ src: m[1], name: m[2] }));

const titles = new Map(readJson("1_front-configs/dist/front-data-projects.json", []).map((p) => [p.path, p.name]));
const proxies = readJson("1_front-configs/dist/_cloud-data-consolidated.json", {})?.services?.["front-end"]?.proxy?.github_pages_proxies || [];
const domains = new Map(proxies.map((p) => [p.github_path, p.domain.split(",")[0].trim()]));

function description(src) {
  try {
    const html = fs.readFileSync(path.join(repoRoot, src, "dist/index.html"), "utf8");
    const m = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i);
    const c = m && m[0].match(/content=["']([^"']*)["']/i);
    return c ? c[1].replace(/\s+/g, " ").trim() : "";
  } catch { return ""; }
}
const groupOf = (src) => {
  const top = src.split("/")[0];
  return top === "e-Root" ? "Root" : top.replace(/^([a-z]_|e-)/, "");
};

// #1072: the project sources are overlaid from split repos (no history here), so a missing commit date falls back to the previous list.
let prevList = null;
try { prevList = JSON.parse(fs.readFileSync(path.join(root, "src/data/gh-pages.json"), "utf8")); } catch {}
const prevDate = new Map((prevList?.sites || []).map((s) => [s.source, s.updated]));

const sites = entries.map(({ src, name }) => {
  const custom = name === "." ? null : domains.get(name) || null;
  const url = custom ? `https://${custom}/` : name === "." ? base : `${base}${name}/`;
  // Last source commit (dist/ excluded: bot noise); sites that only ship a dist/ fall back to its last commit.
  const date = git("log", "-1", "--format=%cs", "--", src, `:(exclude)${src}/dist`) || git("log", "-1", "--format=%cs", "--", src) || prevDate.get(src) || "";
  return {
    group: groupOf(src),
    title: name === "." ? "Root index" : titles.get(src) || readJson(`${src}/build.json`, {}).name || name,
    url,
    custom_domain: custom,
    description: description(src),
    updated: date,
    source: src,
    kind: "monorepo",
  };
});

// ---- separate Pages repos (API) ---------------------------------------------------------
async function api(url) {
  const r = await fetch(url.startsWith("http") ? url : `https://api.github.com${url}`, { headers });
  if (!r.ok) throw Object.assign(new Error(`${url} -> ${r.status}`), { status: r.status });
  return r.json();
}
try {
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = await api(`/users/${owner}/repos?per_page=100&type=owner&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  for (const repo of repos.filter((r) => r.has_pages && !r.private && r.name !== monorepo)) {
    let cname = "", html = "";
    try { const p = await api(`/repos/${owner}/${repo.name}/pages`); cname = p.cname || ""; html = p.html_url || ""; }
    catch {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo.name}/${repo.default_branch}/CNAME`);
        if (r.ok) cname = (await r.text()).trim().split(/\s+/)[0] || "";
      } catch {}
    }
    sites.push({
      group: "Pages repos",
      title: repo.name,
      url: cname ? `https://${cname}/` : html || `${base}${repo.name}/`,
      custom_domain: cname || null,
      description: repo.description || "",
      updated: (repo.pushed_at || "").slice(0, 10),
      source: repo.html_url,
      kind: "repo",
    });
  }
} catch (e) {
  console.warn(`gh-pages: repo listing skipped (${e.message})`);
}

// ---- verify every URL; flag, never hide ---------------------------------------------------
async function probe(url) {
  // Follow same-host redirects only: a hop to another host (e.g. an auth gate) is reported as its 3xx, not as the 200 behind it.
  for (const method of ["HEAD", "GET"]) {
    try {
      let u = url;
      for (let hop = 0; hop < 5; hop++) {
        const r = await fetch(u, { method, redirect: "manual", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "linktree-gh-pages-gen" } });
        const loc = r.headers.get("location");
        if (r.status >= 300 && r.status < 400 && loc) {
          const n = new URL(loc, u);
          if (n.host !== new URL(u).host) return r.status;
          u = n.href;
          continue;
        }
        if (method === "HEAD" && r.status >= 400) break; // some hosts reject HEAD
        return r.status;
      }
    } catch (e) { if (method === "GET") return 0; }
  }
  return 0;
}
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < sites.length) { const s = sites[next++]; s.status = await probe(s.url); s.ok = s.status === 200; }
}));

const order = new Map();
for (const s of sites) if (!order.has(s.group)) order.set(s.group, order.size);
sites.sort((a, b) => order.get(a.group) - order.get(b.group) || a.title.localeCompare(b.title));

// ---- write ------------------------------------------------------------------------------------
const out = path.join(root, "src/data/gh-pages.json");
let prev = null;
try { prev = JSON.parse(fs.readFileSync(out, "utf8")); } catch {}
const broken = sites.filter((s) => !s.ok).length;
if (prev && JSON.stringify(prev.sites) === JSON.stringify(sites)) {
  console.log(`gh-pages: ${sites.length} sites (${broken} broken), unchanged`);
  process.exit(0);
}
const data = {
  _description: `GitHub Pages sites of ${owner}: everything the monorepo deploys (ship.yml PROJECTS) plus separate Pages repos. GENERATED by scripts/gh-pages-gen.mjs; consumed by gh.html with no runtime API calls. status is the HTTP status of url at generation time.`,
  owner,
  generated: new Date().toISOString().slice(0, 10),
  sites,
};
const json = JSON.stringify(data, null, 2);
const wrapper =
  `// GENERATED FROM gh-pages.json by scripts/gh-pages-gen.mjs — DO NOT EDIT BY HAND.\n` +
  `(function () {\n  var g = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : this);\n` +
  `  g.PORTAL_DATA = g.PORTAL_DATA || {};\n  g.PORTAL_DATA["gh-pages"] = ${json}\n;\n})();\n`;
fs.writeFileSync(out, json + "\n");
fs.writeFileSync(path.join(root, "src/data/data-gh-pages.json.js"), wrapper);
if (fs.existsSync(path.join(root, "dist"))) fs.writeFileSync(path.join(root, "dist/data-gh-pages.json.js"), wrapper);
console.log(`gh-pages: ${sites.length} sites written (${broken} broken)`);
