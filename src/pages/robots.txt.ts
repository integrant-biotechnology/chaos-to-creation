import type { APIRoute } from 'astro';

/**
 * Mirrors the meta-robots guard in Base.astro. Staging disallows everything;
 * the live site allows crawling and points at the sitemap. Flipped by the
 * PUBLIC_SITE_LIVE env var at DNS cutover.
 */
const isLive = import.meta.env.PUBLIC_SITE_LIVE === 'true';

const body = isLive
  ? `User-agent: *
Allow: /

Sitemap: https://chaostocreation.com.au/sitemap-index.xml
`
  : `# Staging build — not the live site.
User-agent: *
Disallow: /
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
