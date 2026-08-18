/**
 * Merge vercel.json's redirect and security-header rules into the prebuilt
 * Build Output config (.vercel/output/config.json).
 *
 * Why this exists: CI deploys with `vercel deploy --prebuilt`, which ships
 * the build output verbatim and ignores vercel.json — and the team-scoped
 * token can't run `vercel build`, which is what normally does this merge.
 * Without it, production loses the /press/ redirect and every security
 * header. Runs in CI between `pnpm build` and the deploy.
 *
 * The compiled `src` patterns below are copied verbatim from the last
 * Vercel-built deployment of this project, so behavior matches exactly.
 * Header/redirect VALUES are read from vercel.json at run time; if the
 * SHAPE of vercel.json changes (rules added, sources renamed), the guard
 * below fails the build so the change can't ship silently unmerged.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const VERCEL_JSON = new URL('../vercel.json', import.meta.url);
const OUTPUT_CONFIG = new URL('../.vercel/output/config.json', import.meta.url);

const vercelJson = JSON.parse(readFileSync(VERCEL_JSON, 'utf8'));

// -- Drift guard ----------------------------------------------------------
const redirects = vercelJson.redirects ?? [];
const headerRules = vercelJson.headers ?? [];
const shapeOk =
  redirects.length === 1 &&
  redirects[0].source === '/press/' &&
  redirects[0].destination === '/media/' &&
  redirects[0].permanent === true &&
  headerRules.length === 1 &&
  headerRules[0].source === '/((?!keystatic|api).*)';

if (!shapeOk) {
  console.error(
    'vercel.json changed shape — update scripts/merge-vercel-config.mjs ' +
      'with the newly compiled routes before deploying.',
  );
  process.exit(1);
}

// -- Compiled routes ------------------------------------------------------
const redirectRoute = {
  src: '^/press/$',
  headers: { Location: redirects[0].destination },
  status: 308,
};

const headersRoute = {
  src: '^(?:/((?!keystatic|api).*))$',
  headers: Object.fromEntries(
    headerRules[0].headers.map(({ key, value }) => [key, value]),
  ),
  continue: true,
};

// -- Merge ----------------------------------------------------------------
const config = JSON.parse(readFileSync(OUTPUT_CONFIG, 'utf8'));
config.routes ??= [];

const has = (src) => config.routes.some((r) => r.src === src);
const injected = [];

for (const route of [redirectRoute, headersRoute]) {
  if (!has(route.src)) injected.push(route);
}

if (injected.length === 0) {
  console.log('merge-vercel-config: routes already present, nothing to do');
} else {
  config.routes.unshift(...injected);
  writeFileSync(OUTPUT_CONFIG, JSON.stringify(config, null, 2) + '\n');
  console.log(
    `merge-vercel-config: injected ${injected.length} route(s):`,
    injected.map((r) => r.src).join(', '),
  );
}
