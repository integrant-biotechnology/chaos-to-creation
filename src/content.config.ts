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

const faq = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/faq' }),
  schema: z.object({
    order: z.number().int().default(0),
    question: z.string(),
    answer: z.string(),
  }),
});

export const collections = { hallmarks, formats, press, endorsements, faq };
