import data from '../data/pages.json';

/**
 * Page metadata — ONE table decides the <head> of every page.
 *
 * src/data/pages.json is the single source for titles, descriptions,
 * canonicals, robots, Open Graph, breadcrumbs, the sitemap and the trailing-
 * slash redirects. It is JSON (not TS) so the plain-Node build scripts
 * (scripts/check-seo.mjs, scripts/merge-vercel-config.mjs) read exactly the
 * same data without a loader. Edit copy there, not in the page files.
 */

export const SITE = data.site;

export type OgType = 'website' | 'book' | 'profile';

export interface PageEntry {
  /** Canonical path: '/' or '/name/' (always a trailing slash). */
  path: string;
  title: string;
  description: string;
  ogType: OgType;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  /** Label for this page in the BreadcrumbList. */
  breadcrumb: string;
  /** Files whose last git commit is this page's sitemap <lastmod>. */
  sources: string[];
  /** Site-relative images listed for this page in the image sitemap. */
  images: string[];
}

export const PAGES = data.pages as PageEntry[];
export const NOT_FOUND = data.notFound;
export const DEFAULT_OG_IMAGE = data.defaultOgImage;
export const DEFAULT_OG_IMAGE_ALT = data.defaultOgImageAlt;

/** Absolute URL on the canonical host. */
export const abs = (path: string) => new URL(path, SITE).href;

export function pageFor(path: string): PageEntry {
  const entry = PAGES.find((p) => p.path === path);
  if (!entry) {
    throw new Error(
      `No entry for "${path}" in src/data/pages.json — every page needs one.`,
    );
  }
  return entry;
}

export const indexablePages = () => PAGES.filter((p) => !p.noindex);
