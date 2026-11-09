/**
 * Merge vercel.json's redirects and headers — plus the trailing-slash
 * redirects derived from src/data/pages.json — into the prebuilt Build Output
 * config (.vercel/output/config.json).
 *
 * Why this exists: CI deploys with `vercel deploy --prebuilt`, which ships
 * the build output verbatim and ignores vercel.json, and the team-scoped
 * token can't run `vercel build`, which is what normally does this merge.
 * Runs in CI between `pnpm build` and the deploy.
 *
 * Every route it writes is compiled HERE from a known pattern, so the output
 * is predictable; an unknown vercel.json source fails the run rather than
 * shipping a guessed regex. After merging it re-reads the config and asserts
 * every required route sits before the filesystem handler.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const read = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
const OUTPUT_CONFIG = new URL('../.vercel/output/config.json', import.meta.url);

const vercelJson = read('../vercel.json');
const pages = read('../src/data/pages.json').pages;

const fail = (msg) => {
  console.error(`merge-vercel-config: ${msg}`);
  process.exit(1);
};
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// -- Redirects: exact literal paths only ---------------------------------
const redirectRoutes = (vercelJson.redirects ?? []).map((r) => {
  if (!/^\/[A-Za-z0-9._\-/]*$/.test(r.source)) {
    fail(`redirect source "${r.source}" is not a literal path — compile it by hand here first.`);
  }
  if (r.permanent !== true) fail(`redirect ${r.source} must be permanent (308).`);
  return {
    src: `^${escapeRe(r.source)}$`,
    headers: { Location: r.destination },
    status: 308,
  };
});

// -- Trailing slash: known pages only, so unknown URLs stay a direct 404 ---
const slugs = pages
  .map((p) => p.path)
  .filter((p) => p !== '/')
  .map((p) => {
    if (!/^\/[a-z0-9-]+\/$/.test(p)) fail(`page path "${p}" is not of the form /name/.`);
    return p.slice(1, -1);
  });
const slashRoute = {
  src: `^/(${slugs.map(escapeRe).join('|')})$`,
  headers: { Location: '/$1/' },
  status: 308,
};

// -- Headers: known sources, compiled patterns -----------------------------
const HEADER_SOURCES = {
  '/((?!keystatic|api).*)': '^(?:/((?!keystatic|api).*))$',
  '/keystatic/:path*': '^/keystatic(?:/.*)?$',
  '/api/keystatic/:path*': '^/api/keystatic(?:/.*)?$',
};
const headerRoutes = (vercelJson.headers ?? []).map((h) => {
  const src = HEADER_SOURCES[h.source];
  if (!src) fail(`header source "${h.source}" has no compiled pattern — add it to HEADER_SOURCES.`);
  return {
    src,
    headers: Object.fromEntries(h.headers.map(({ key, value }) => [key, value])),
    continue: true,
  };
});

// -- Merge (idempotent: replaces routes with the same src) -----------------
const ours = [...headerRoutes, ...redirectRoutes, slashRoute];
const config = JSON.parse(readFileSync(OUTPUT_CONFIG, 'utf8'));
const oursSrc = new Set(ours.map((r) => r.src));
config.routes = [...ours, ...(config.routes ?? []).filter((r) => !oursSrc.has(r.src))];
writeFileSync(OUTPUT_CONFIG, JSON.stringify(config, null, 2) + '\n');

// -- Verify what was written -----------------------------------------------
const written = JSON.parse(readFileSync(OUTPUT_CONFIG, 'utf8')).routes;
const fsIndex = written.findIndex((r) => r.handle === 'filesystem');
if (fsIndex === -1) fail('no filesystem handler in config.json — unexpected build output.');
for (const r of ours) {
  const i = written.findIndex((w) => w.src === r.src);
  if (i === -1 || i > fsIndex) fail(`route ${r.src} missing or after the filesystem handler.`);
  new RegExp(r.src); // throws on an invalid pattern
}
const stray = written.slice(0, fsIndex).filter((r) => r.status && r.status !== 308 && !oursSrc.has(r.src));
if (stray.length) fail(`unexpected non-308 redirects before filesystem: ${stray.map((r) => r.src).join(', ')}`);

console.log(`merge-vercel-config: ${ours.length} routes in place before filesystem:`);
for (const r of ours) console.log(`  ${r.status ?? 'hdr'}  ${r.src}${r.headers?.Location ? ` → ${r.headers.Location}` : ''}`);
