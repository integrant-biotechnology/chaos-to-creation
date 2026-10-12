# Chaos to Creation

Website for the book *Chaos to Creation: Longevity & Regeneration Frontiers* by Prof. Gordon Slater.

**Live site:** [chaostocreation.com.au](https://chaostocreation.com.au)

## Overview

A static, dark-only book site: the book and its editions, an excerpt, the author, research background, a media kit and purchase links. Purchases are completed on Amazon AU; the site holds no cart, payment or customer data.

## Stack

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) — static output with the Vercel adapter |
| Styling | Tailwind CSS 4 — design tokens in `src/styles/` |
| Content | [Keystatic](https://keystatic.com) — git-based CMS, admin at `/keystatic` |
| Hosting | Vercel, deployed by GitHub Actions |

Every public page ships as static HTML. Only the `/keystatic` admin is server-rendered.

## Getting started

Requires Node.js 22.12 or later and [pnpm](https://pnpm.io) 10.

```bash
pnpm install
pnpm dev
```

The site runs at `http://localhost:4321`. No environment variables are needed for local development.

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build locally |

## Editing content

Book details, editions, FAQs, press quotes, endorsements and the author biography are edited through the CMS at `/keystatic` (`http://localhost:4321/keystatic` when running locally). In production, sign in with GitHub.

Changes are saved as plain files in `src/content/` and `src/data/`, so all content is versioned in git and can also be edited directly.

## Project structure

```text
src/
  pages/        Routes: home, the book, excerpt, author, research, media, buy, contact
  components/   Page sections and UI components
  layouts/      Shared page shell
  content/      CMS-managed content collections
  data/         CMS-managed structured data
  styles/       Design tokens and global styles
  assets/       Images processed at build time
public/         Static files served as-is
scripts/        Icon and share-card generators, deploy helpers
```

Design notes:

- The site is dark-only by design; there is no light theme.
- Icons and the Open Graph share card are committed files. Regenerate them with `node scripts/icons.mjs` and `node scripts/og.mjs` after changing the source artwork.

## Deployment

Deployments run through GitHub Actions rather than Vercel's git integration.

- **Push to `main`** — `.github/workflows/deploy.yml` builds the site and promotes it to production.
- **Pull request against `main`** — `.github/workflows/preview.yml` deploys a non-indexed preview and comments its URL on the pull request.
- **Manual deploy** — run the "Deploy production" workflow from the Actions tab (`main` only).
- **Rollback** — revert the offending commit and push, or promote an earlier deployment from the Vercel dashboard.

The workflows read three repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.

## Advertising compliance

Prof. Slater is an AHPRA-registered practitioner, so site content is reviewed against the AHPRA guidelines for advertising a regulated health service and the TGA Therapeutic Goods Advertising Code. No stock photography of people presented as patients is used.

## Image credits

| File | Source | Licence |
|---|---|---|
| `src/assets/micrograph.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bovine_Pulmonary_Artery_Endothelial_Cells_Fluorescent_Image_3.jpg), by Erin Rod | CC BY 4.0 — attribution required |
| `src/assets/cover.png` | Book cover, supplied by the author | All rights reserved |
| `src/assets/portrait.jpg`, `public/portrait-gordon-slater-hero.jpg` | Author portrait, supplied by the author | All rights reserved |
| `src/assets/launch.jpg`, `public/launch-chaos-to-creation.jpg` | Launch artwork, supplied by the author | All rights reserved |

## Licence

No open-source licence is granted. All rights are reserved by the respective owners.
