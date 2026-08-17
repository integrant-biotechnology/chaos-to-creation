# Chaos to Creation

Website for the book *Chaos to Creation: Longevity & Regeneration Frontiers* by
Prof. Gordon Slater — [chaostocreation.com.au](https://chaostocreation.com.au).
Replaces the old WordPress site. Built with Astro, hosted on Vercel.

## Run it locally

First time on a new Mac? Install pnpm and Node 22 (one-off):

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
# reopen Terminal, then:
pnpm env use --global 22
```

Then, in the repo folder:

```bash
pnpm install
pnpm dev
```

Site runs at http://localhost:4321. No env vars or other setup needed.

## Editing content (no code needed)

All the words on the site — book details, editions, FAQs, press quotes,
endorsements, author bio — are edited through the CMS at **`/keystatic`**
(http://localhost:4321/keystatic when running locally).

Changes save as plain files in `src/content/` and `src/data/`, so everything
stays in git. You can also edit those files directly if you prefer.

## Stack

| | |
|---|---|
| Framework | Astro 7 (static output, Vercel adapter) |
| Styling | Tailwind CSS 4 — design tokens in `src/styles/` |
| CMS | Keystatic (git-based, admin at `/keystatic`) |
| Buying | Amazon AU links only — no cart or payments on our side |

Pages are in `src/pages/`, components in `src/components/`. Every public page
ships as static HTML; only the `/keystatic` admin is server-rendered.

Two things to know before changing the design:
- The site is **dark-only** by design — don't add a light theme.
- Icons and the OG share card are committed files. If you change them,
  regenerate locally with `node scripts/icons.mjs` / `node scripts/og.mjs`.

## Deploying

Push to `main` → Vercel builds and deploys production automatically. Any other
branch gets a preview URL. Nothing manual.

Staging builds are noindexed until `PUBLIC_SITE_LIVE=true` is set on Vercel —
that flips at DNS cutover.

## TODO before launch

- [ ] **Best-seller claim** — needs a dated Amazon screenshot, then fill
      `category` / `rank` / `verifiedOn` in the Book details (via `/keystatic`).
- [ ] **Enquiry email** — currently the practice admin inbox
      (`admin@drgordonslater.com.au`). Confirm or change (one field in Book details).
- [ ] **CMS in production** — visit `/keystatic` on the deployed URL, follow the
      GitHub App setup, add the three env vars it returns to Vercel.
- [ ] **Star ratings** — `book.rating` is empty and hidden; fill with real
      Amazon numbers when we have them.
- [ ] **Post-nominals** — byline shows "MBBS, FRACS" from the cover art. Confirm
      with Adelaide.
- [ ] **Extract** — hero CTA says "About the book" until the client supplies an
      extract for `/the-book/`.
- [ ] **Old URLs** — before DNS cutover, redirect the old WordPress paths
      (e.g. `/checkout-2/` → `/buy/`).
- [ ] **Compliance glance** — Prof. Slater is AHPRA-registered; sanity-check the
      site against AHPRA/TGA advertising rules before launch.

## Image credits

All images are cleared for commercial use; attribution given where required.

| File | Source | Licence |
|---|---|---|
| `src/assets/micrograph.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bovine_Pulmonary_Artery_Endothelial_Cells_Fluorescent_Image_3.jpg), by Erin Rod | **CC BY 4.0** — attribution required |
| `src/assets/cover.png` | Client-supplied book cover | Client-owned |
| `src/assets/portrait.jpg`, `public/portrait-gordon-slater-hero.jpg` | Client-supplied portrait | Client-owned |
| `src/assets/launch.jpg`, `public/launch-chaos-to-creation.jpg` | Client marketing art | Client-owned |

No stock photos of people presented as patients — that runs into AHPRA
advertising rules on a registered practitioner's site.
