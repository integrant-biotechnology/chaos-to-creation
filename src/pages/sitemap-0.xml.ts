import type { APIRoute } from 'astro';
import { abs, indexablePages } from '../lib/seo';
import { lastCommitDate } from '../lib/lastmod';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Every indexable page from src/data/pages.json, on the canonical host and in
 * its canonical trailing-slash form — the same URLs the pages' canonicals
 * use. noindex pages are left out by construction.
 */
export const GET: APIRoute = () => {
  const urls = indexablePages()
    .map((p) => {
      const images = p.images
        .map((src) => `\n    <image:image><image:loc>${esc(abs(src))}</image:loc></image:image>`)
        .join('');
      return `  <url>
    <loc>${esc(abs(p.path))}</loc>
    <lastmod>${lastCommitDate([...p.sources, 'src/data/pages.json'])}</lastmod>${images}
  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
