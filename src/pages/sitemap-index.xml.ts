import type { APIRoute } from 'astro';
import { abs, indexablePages } from '../lib/seo';
import { lastCommitDate } from '../lib/lastmod';

/** Sitemap index → the one URL set. Same table as every page's <head>. */
export const GET: APIRoute = () => {
  const lastmod = lastCommitDate([
    ...new Set(indexablePages().flatMap((p) => p.sources)),
    'src/data/pages.json',
  ]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${abs('/sitemap-0.xml')}</loc><lastmod>${lastmod}</lastmod></sitemap>
</sitemapindex>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
