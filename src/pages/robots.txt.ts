import type { APIRoute } from 'astro';
import { abs } from '../lib/seo';

/**
 * Mirrors the meta-robots guard in Base.astro. Staging disallows everything;
 * the live site allows crawling, keeps the CMS admin out, and points at the
 * sitemap on the canonical host. Flipped by PUBLIC_SITE_LIVE (set in CI for
 * production builds only).
 */
const isLive = import.meta.env.PUBLIC_SITE_LIVE === 'true';

const body = isLive
  ? `User-agent: *
Allow: /
Disallow: /keystatic/
Disallow: /api/

Sitemap: ${abs('/sitemap-index.xml')}
`
  : `# Staging build — not the live site.
User-agent: *
Disallow: /
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
