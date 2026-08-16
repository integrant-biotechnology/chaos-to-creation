import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The nine hallmarks of aging (López-Otín et al.). A canonical named set from
 * the literature, which is the one place on this site where numbering carries
 * real information rather than decoration.
 */
const hallmarks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/hallmarks' }),
  schema: z.object({
    order: z.number().int().min(1).max(9),
    name: z.string(),
    summary: z.string(),
  }),
});

/** Purchase formats. Amazon AU deep links only — no direct commerce. */
const formats = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/formats' }),
  schema: z.object({
    order: z.number().int(),
    name: z.enum(['Hardcover', 'Paperback', 'Kindle']),
    asin: z.string(),
    isbn: z.string().optional(),
    price: z.number(),
    currency: z.string().default('AUD'),
    url: z.string().url(),
    note: z.string().optional(),
    /** How the edition reaches the buyer, e.g. "Ships from Amazon AU". */
    delivery: z.string().optional(),
    /** The site's own editorial recommendation — at most one edition. */
    featured: z.boolean().default(false),
  }),
});

/** Press coverage and review quotes. */
const press = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/press' }),
  schema: z.object({
    outlet: z.string(),
    date: z.coerce.date(),
    url: z.string().url().optional(),
    quote: z.string().optional(),
  }),
});

/** Endorsements from named individuals. */
const endorsements = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/endorsements' }),
  schema: z.object({
    order: z.number().int().default(0),
    name: z.string(),
    title: z.string(),
    quote: z.string(),
  }),
});

/**
 * Peer-reviewed publications for /research/. The page renders an intentional
 * empty state until entries are added via /keystatic, so nothing here is
 * fabricated on the author's behalf.
 */
const publications = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/publications' }),
  schema: z.object({
    order: z.number().int().default(0),
    title: z.string(),
    year: z.number().int(),
    journal: z.string().optional(),
    url: z.string().url().optional(),
    doi: z.string().optional(),
    summary: z.string().optional(),
  }),
});

/** The published extract — one Markdoc document, edited whole in Keystatic. */
const excerpt = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/excerpt' }),
  schema: z.object({
    kicker: z.string(),
    title: z.string(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/faq' }),
  schema: z.object({
    order: z.number().int().default(0),
    question: z.string(),
    answer: z.string(),
  }),
});

export const collections = {
  hallmarks,
  formats,
  press,
  endorsements,
  faq,
  publications,
  excerpt,
};
