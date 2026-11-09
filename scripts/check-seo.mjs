#!/usr/bin/env node
/**
 * SEO gate — runs at the end of `pnpm build` (locally and in CI, before any
 * deploy). Reads the finished static output exactly as it will be deployed and
 * fails the build if any page regresses.
 *
 * Zero dependencies: regex over the HTML Astro generates, checked against the
 * same table (src/data/pages.json) the pages are built from.
 *
 * Two modes, keyed off the same env var the build uses:
 *   PUBLIC_SITE_LIVE=true  production: robots meta must match the table and
 *                          robots.txt must allow crawling.
 *   otherwise              staging/preview: every page must be
 *                          "noindex, nofollow" and robots.txt must disallow /.
 * Everything else is checked in both modes.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, '.vercel/output/static');
const table = JSON.parse(readFileSync(join(root, 'src/data/pages.json'), 'utf8'));
const SITE = table.site;
const live = process.env.PUBLIC_SITE_LIVE === 'true';

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

// Medical-practitioner advertising (AHPRA/TGA): no superlatives, outcome
// guarantees, testimonials or unverifiable accolades in search snippets.
const RESTRICTED =
  /\b(best|leading|top[- ]rated|number one|world[- ]class|guarantee[ds]?|cure[ds]?|miracle|testimonials?|best[- ]?sell(?:er|ing)s?)\b|#\s?1\b/i;

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const all = (s, re) => [...s.matchAll(re)].map((m) => m[1]);
// Astro may emit attributes in either order; match both.
const meta = (html, attr, key) => {
  const k = key.replace(/[:]/g, '\\:');
  return [
    ...all(html, new RegExp(`<meta ${attr}="${k}" content="([^"]*)"`, 'g')),
    ...all(html, new RegExp(`<meta content="([^"]*)" ${attr}="${k}"`, 'g')),
  ];
};
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === '_astro' ? [] : walk(full);
    return name.endsWith('.html') ? [full] : [];
  });
const len = (s) => [...s].length;

if (!existsSync(out)) {
  console.error(`✗ check-seo: ${out} not found — run astro build first.`);
  process.exit(1);
}

// ---- the table itself ----------------------------------------------------
const byPath = new Map();
for (const p of table.pages) {
  if (byPath.has(p.path)) err('pages.json', `duplicate path ${p.path}`);
  if (!/^\/([a-z0-9-]+\/)?$/.test(p.path)) err('pages.json', `path ${p.path} must be "/" or "/name/"`);
  byPath.set(p.path, p);
}
const indexable = new Set(table.pages.filter((p) => !p.noindex).map((p) => `${SITE}${p.path}`));

// ---- robots.txt & sitemaps ---------------------------------------------------
const readOut = (f) => (existsSync(join(out, f)) ? readFileSync(join(out, f), 'utf8') : null);
const robotsTxt = readOut('robots.txt');
const sitemapIndex = readOut('sitemap-index.xml');
const sitemap0 = readOut('sitemap-0.xml');
if (!robotsTxt) err('robots.txt', 'missing');
if (!sitemapIndex) err('sitemap-index.xml', 'missing');
if (!sitemap0) err('sitemap-0.xml', 'missing');

if (robotsTxt) {
  const disallowAll = /^Disallow:\s*\/\s*$/m.test(robotsTxt);
  if (live) {
    if (disallowAll) err('robots.txt', 'disallows the whole site on a live build');
    const line = robotsTxt.match(/^Sitemap:\s*(\S+)\s*$/m)?.[1];
    if (line !== `${SITE}/sitemap-index.xml`) err('robots.txt', `Sitemap: line is ${line}, want ${SITE}/sitemap-index.xml`);
  } else if (!disallowAll) {
    err('robots.txt', 'staging build must disallow / (PUBLIC_SITE_LIVE is not "true")');
  }
}
if (sitemapIndex) {
  const locs = all(sitemapIndex, /<loc>([^<]+)<\/loc>/g);
  if (locs.length !== 1 || locs[0] !== `${SITE}/sitemap-0.xml`) err('sitemap-index.xml', `should list exactly ${SITE}/sitemap-0.xml, lists ${locs.join(', ')}`);
}
const sitemapUrls = new Set();
if (sitemap0) {
  for (const block of all(sitemap0, /<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) { err('sitemap-0.xml', 'a <url> without <loc>'); continue; }
    if (sitemapUrls.has(loc)) err('sitemap-0.xml', `duplicate ${loc}`);
    sitemapUrls.add(loc);
    if (!loc.startsWith(`${SITE}/`)) err('sitemap-0.xml', `${loc} is not on ${SITE}`);
    if (!loc.endsWith('/')) err('sitemap-0.xml', `${loc} is not in trailing-slash form`);
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (!lastmod || Number.isNaN(Date.parse(lastmod))) err('sitemap-0.xml', `${loc} has no valid <lastmod>`);
    for (const img of all(block, /<image:loc>([^<]+)<\/image:loc>/g)) {
      if (!img.startsWith(`${SITE}/`)) err('sitemap-0.xml', `image ${img} is not on ${SITE}`);
      else if (!existsSync(join(out, decode(new URL(img).pathname)))) err('sitemap-0.xml', `image ${img} is not in the build output`);
    }
  }
  for (const u of indexable) if (!sitemapUrls.has(u)) err('sitemap-0.xml', `indexable page missing: ${u}`);
  for (const u of sitemapUrls) if (!indexable.has(u)) err('sitemap-0.xml', `lists ${u}, which is not an indexable page in pages.json`);
}

// ---- every HTML page -------------------------------------------------------
const titles = new Map();
const descriptions = new Map();
const seen = new Set();

for (const file of walk(out)) {
  const rel = relative(out, file);
  const html = readFileSync(file, 'utf8');
  const is404 = rel === '404.html';
  const path = is404 ? null : rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
  const entry = path && byPath.get(path);

  if (!is404 && !entry) {
    err(rel, `page ${path} has no entry in src/data/pages.json`);
    continue;
  }
  if (path) seen.add(path);

  const titleTags = all(html, /<title>([^<]*)<\/title>/g);
  const descs = meta(html, 'name', 'description');
  const robots = meta(html, 'name', 'robots');
  const canonicals = all(html, /<link rel="canonical" href="([^"]*)"/g);
  const h1s = all(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/g);
  const title = decode(titleTags[0] ?? '');
  const desc = decode(descs[0] ?? '');

  if (titleTags.length !== 1) err(rel, `expected 1 <title>, found ${titleTags.length}`);
  if (descs.length !== 1) err(rel, `expected 1 meta description, found ${descs.length}`);
  if (robots.length !== 1) err(rel, `expected 1 meta robots, found ${robots.length}`);
  if (h1s.length !== 1) err(rel, `expected exactly 1 <h1>, found ${h1s.length}`);
  else if (!decode(h1s[0].replace(/<[^>]+>/g, '')).trim()) err(rel, '<h1> is empty');

  // robots per mode
  const wantRobots = !live ? 'noindex, nofollow' : is404 || entry?.noindex ? 'noindex,follow' : 'index,follow';
  if (robots[0] !== wantRobots) err(rel, `meta robots "${robots[0]}", want "${wantRobots}"`);

  // Open Graph / Twitter basics
  for (const k of ['og:title', 'og:description', 'og:image', 'og:type'])
    if (meta(html, 'property', k).length !== 1) err(rel, `expected 1 ${k}`);
  if (meta(html, 'name', 'twitter:card')[0] !== 'summary_large_image') err(rel, 'twitter:card is not summary_large_image');
  const ogImage = meta(html, 'property', 'og:image')[0];
  if (ogImage && !decode(ogImage).startsWith(`${SITE}/`)) err(rel, `og:image ${ogImage} is not absolute on ${SITE}`);

  // JSON-LD: parses, has @context, no raw "</", and every {"@id"} reference is defined.
  const blocks = all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!is404 && blocks.length !== 1) err(rel, `expected 1 JSON-LD block, found ${blocks.length}`);
  for (const raw of blocks) {
    if (raw.includes('</')) err(rel, 'JSON-LD contains an unescaped "</"');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      err(rel, `JSON-LD does not parse: ${e.message}`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org') err(rel, 'JSON-LD @context is not https://schema.org');
    const defined = new Set();
    const refs = new Set();
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      const keys = Object.keys(node);
      if (keys.length === 1 && keys[0] === '@id') refs.add(node['@id']);
      else if (node['@id']) {
        if (defined.has(node['@id'])) err(rel, `JSON-LD defines ${node['@id']} twice`);
        defined.add(node['@id']);
      }
      Object.values(node).forEach(visit);
    };
    visit(data);
    for (const r of refs) if (!defined.has(r)) err(rel, `JSON-LD references undefined @id ${r}`);
    if (path) {
      const wp = (data['@graph'] ?? []).find((n) => n['@id'] === `${SITE}${path}#webpage`);
      if (!wp) err(rel, `JSON-LD has no WebPage node for ${SITE}${path}`);
      else if (wp.url !== `${SITE}${path}`) err(rel, `WebPage url ${wp.url} ≠ canonical`);
    }
  }

  if (is404) {
    if (canonicals.length) err(rel, '404 page must not have a canonical');
    continue;
  }

  // canonical: exactly one, self-referencing, on the canonical host
  const expected = `${SITE}${path}`;
  if (canonicals.length !== 1) err(rel, `expected 1 canonical, found ${canonicals.length}`);
  else if (decode(canonicals[0]) !== expected) err(rel, `canonical ${canonicals[0]} should be ${expected}`);
  if (meta(html, 'property', 'og:url')[0] !== canonicals[0]) err(rel, 'og:url differs from canonical');

  // title & description: present, in range, unique, compliant, matching the table
  if (len(title) < 15 || len(title) > 60) err(rel, `title is ${len(title)} chars (want 15–60): "${title}"`);
  if (len(desc) < 50 || len(desc) > 160) err(rel, `description is ${len(desc)} chars (want 50–160)`);
  if (RESTRICTED.test(title)) err(rel, `restricted wording in title: "${title}"`);
  if (RESTRICTED.test(desc)) err(rel, `restricted wording in description: "${desc}"`);
  if (title !== entry.title) err(rel, 'title differs from pages.json');
  if (desc !== entry.description) err(rel, 'description differs from pages.json');
  if (titles.has(title)) err(rel, `duplicate title (also ${titles.get(title)})`);
  if (descriptions.has(desc)) err(rel, `duplicate description (also ${descriptions.get(desc)})`);
  titles.set(title, rel);
  descriptions.set(desc, rel);
}

if (!existsSync(join(out, '404.html'))) err('404.html', 'missing');
for (const p of byPath.keys()) if (!seen.has(p)) err('pages.json', `${p} is listed but no page was built for it`);

if (errors.length) {
  console.error(`\n✗ SEO gate failed (${errors.length}):\n  - ${errors.join('\n  - ')}\n`);
  process.exit(1);
}
console.log(
  `✓ SEO gate (${live ? 'live' : 'staging'}): ${seen.size} pages + 404, ${indexable.size} in sitemap, ` +
    `unique titles/descriptions, self-canonicals on ${SITE}, JSON-LD graph resolves`,
);
