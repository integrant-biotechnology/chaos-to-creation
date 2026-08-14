# Chaos to Creation

Marketing site for *Chaos to Creation: Longevity & Regeneration Frontiers* by Prof. Gordon Slater.

Rebuild of [chaostocreation.com.au](https://chaostocreation.com.au), replacing a WordPress
(Astra + Elementor Pro + Easy Digital Downloads) single-pager.

## Stack

| | |
|---|---|
| Framework | Astro 7 (static output, Vercel adapter) |
| Styling | Tailwind CSS 4 (`@theme` tokens) |
| Content | Content Collections 2.0 + Zod |
| CMS | Keystatic (git-based, admin at `/keystatic`) |
| Fonts | Astro Fonts API — self-hosted, preloaded |
| Commerce | Amazon AU deep links only. No cart, no payment surface. |

## Commands

```bash
pnpm install
pnpm dev      # http://localhost:4321 — CMS at /keystatic
pnpm build
pnpm preview
```

## Architecture notes

**Static everywhere except the CMS.** `output: 'static'`, so every public page ships as
HTML. Only the Keystatic admin route opts out via `prerender = false`. The 2.6MB Keystatic
React bundle is admin-only — the public homepage loads **2,490 bytes** of JS (Astro's
prefetch module) and nothing else.

**The design direction is "dark field."** The palette is drawn from immunofluorescence
microscopy — the actual visual artifact of regenerative-medicine research. The emissive
cyan (`--color-lumen`) descends from the practice brand teal `#3AA6B9`, keeping the
identity connected to Prof. Slater's clinical work.

**The signature is the light progression.** The page opens dark (hero, the nine hallmarks)
and dissolves into a clinical light register (author, editions) — chaos to creation
expressed as the page's own brightening. It costs **zero JavaScript**: cards resolve via
CSS `animation-timeline: view()`, and because the settled state is the default, browsers
without support and users with `prefers-reduced-motion` get the finished layout rather
than a broken one.

**Numbering appears in exactly one place** — the nine hallmarks of aging — because that is
a canonical enumerated set from the literature where the index carries real information.
They are a set, not a sequence, so it renders as a constellation grid rather than a
numbered process list.

## Content model

Editable at `/keystatic`. Collections live in `src/content/`, singletons in `src/data/`.

- `hallmarks` — the nine hallmarks of aging
- `formats` — hardcover / paperback / Kindle, with ASIN, ISBN, price, Amazon URL
- `press`, `endorsements`, `faq`
- `book`, `author` — singletons

## Image credits

Licence obligations are real, not decorative. Every image below is cleared for
commercial use; attribution is required where stated and is discharged here.

| File | Source | Licence | Attribution |
|---|---|---|---|
| `src/assets/micrograph.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bovine_Pulmonary_Artery_Endothelial_Cells_Fluorescent_Image_3.jpg) | **CC BY 4.0** | Erin Rod |
| `src/assets/cover.png` | Client-supplied book cover | Client-owned | Prof. Gordon Slater |
| `src/assets/portrait.jpg` + `public/portrait-gordon-slater-hero.jpg` | Client-supplied author portrait | Client-owned | Prof. Gordon Slater |

The micrograph is a triple-stain immunofluorescence image of bovine pulmonary
artery endothelial cells — blue nuclei, green actin, red mitochondria. It was
chosen over the alternatives deliberately: several higher-ranked search results
were oral-cancer imagery, which is both contextually wrong for a longevity book
and needlessly loaded on an AHPRA-registered practitioner's site. Healthy cells,
and mitochondrial dysfunction happens to be one of the nine hallmarks the book
works through.

**Deliberately excluded:** stock photography of people presented as patients.
Imagery implying clinical treatment or outcomes on a site that also markets a
registered practitioner sits squarely inside AHPRA advertising rules.

## Open items

1. **The best-seller claim is unsubstantiated.** The press release states only "bestseller
   status" — no category, rank, or date. Amazon badges are category- and time-specific.
   `BestsellerMark.astro` renders the claim as given until `category` / `rank` /
   `verifiedOn` are filled in `src/data/book.json` (or via Keystatic), at which point
   every placement upgrades to "#1 in &lt;category&gt;" with no code change. **Needs a
   dated screenshot before launch.**

2. **Confirm the enquiry address.** `book.enquiryEmail` is currently
   `admin@drgordonslater.com.au`, taken from Adelaide's email signature. That is the
   practice admin inbox, not a confirmed book address — it routes all media, speaking,
   bulk-order and rights enquiries into clinical admin. One field to change.

3. **The contact form is deliberately mail-routed, not posted.** `/contact/` offers four
   pre-addressed enquiry lines (media, speaking, bulk, rights), each opening a `mailto:`
   with the subject and a field prompt already filled. No backend, nothing to break, and
   press enquiries arrive pre-sorted. A posted form needs a verified sending domain —
   Resend is available on the Vercel Marketplace and its terms are already accepted, but
   nothing is provisioned. Provisioning needs a sending domain
   (`send.chaostocreation.com.au` recommended, to isolate sending reputation) plus SPF and
   DKIM records on the `chaostocreation.com.au` zone.
4. **Compliance glance.** Prof. Slater is AHPRA-registered and the book covers stem cells
   and hyperbaric oxygen therapy. Marketing a book is not marketing a therapy, but a
   practitioner's site connecting the two can attract AHPRA advertising and TGA scrutiny.
   Worth a check before launch.
5. **Finish the Keystatic GitHub wiring.** Storage is already environment-aware: `local`
   in development, `github` as soon as `KEYSTATIC_GITHUB_CLIENT_ID` exists, so a missing
   credential can never break the build. To activate the CMS in production, visit
   `/keystatic` on the deployed URL, follow the GitHub App setup, and add the three
   variables it returns (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
   `KEYSTATIC_SECRET`) to the Vercel project.
6. **Staging is noindexed.** Every build emits `robots: noindex,nofollow` and a
   `Disallow: /` robots.txt unless `PUBLIC_SITE_LIVE=true`. Set that env var at DNS
   cutover; it also switches robots.txt to `Allow` with the sitemap reference.
7. **Assets needed:** print-quality cover only — the author portrait was supplied
   2026-08-14 and is live on /author/, the homepage, and the press kit (downloadable).
   (Association logos were considered and rejected — implied-endorsement risk under
   AHPRA advertising rules.)
8. **Star ratings**: `book.rating` in `src/data/book.json` ships empty and renders
   nothing. Fill `stars`/`count`/`url` with the real Amazon numbers to show them.
9. **MBBS**: the byline now renders `author.postNominals` ("MBBS, FRACS"), sourced
   from the qualifications printed on the client-supplied cover art. Confirm with
   Adelaide.
10. **Extract text**: the hero CTA reads "About the book" because no extract exists.
   When the client supplies one, add it to /the-book/ with `id="extract"` and relabel
   the CTA to a specific promise.
11. **Icons and the OG share card are committed artifacts** — regenerate locally with
   `node scripts/icons.mjs` / `node scripts/og.mjs` (not build steps: CI fonts differ).
12. **The practice site is out of scope.** `orthopaedic-surgeon.com.au` also needs a
   best-seller mention; it is not covered by this repo.

## Migration

Before DNS cutover: crawl the live WordPress site for its full URL inventory, then
redirect `/checkout-2/` → `/buy/`, and 410 `/feed/` and `/comments/feed/`.
`.com.au` domains need auDA-registrar access.
