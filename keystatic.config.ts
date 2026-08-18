import { config, collection, singleton, fields } from '@keystatic/core';

/**
 * Marketing edits content here (/keystatic) and Keystatic commits straight to
 * the repo, which triggers a rebuild. Content stays version-controlled, there
 * is no monthly cost, and no external service holds the copy.
 *
 * Storage switches by environment. `local` writes to the working tree, which
 * only works on a writable filesystem — a serverless function has none, so
 * production must use `github`.
 *
 * To finish the production wiring:
 *   1. Visit /keystatic on the deployed URL and follow the GitHub App setup.
 *   2. It writes back KEYSTATIC_GITHUB_CLIENT_ID, KEYSTATIC_GITHUB_CLIENT_SECRET
 *      and KEYSTATIC_SECRET — add all three to the Vercel project.
 * Until those exist the admin falls back to local mode, so the build never
 * breaks on a missing credential.
 */
const useGitHub = Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_ID);

export default config({
  storage: useGitHub
    ? {
        kind: 'github',
        // The repo lives under the org — the Keystatic GitHub App must be
        // installed on integrant-biotechnology, not a personal account.
        repo: { owner: 'integrant-biotechnology', name: 'chaos-to-creation' },
      }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Chaos to Creation' },
    navigation: {
      Book: ['book', 'excerpt', 'formats', 'hallmarks', 'faq'],
      Credibility: ['press', 'endorsements'],
      Author: ['author', 'publications'],
    },
  },

  singletons: {
    book: singleton({
      label: 'Book details',
      path: 'src/data/book',
      format: { data: 'json' },
      schema: {
        title: fields.text({ label: 'Title' }),
        subtitle: fields.text({ label: 'Subtitle' }),
        tagline: fields.text({ label: 'Tagline' }),
        summary: fields.text({
          label: 'Short summary',
          description: 'Used in the hero and as the meta description.',
          multiline: true,
        }),
        description: fields.text({
          label: 'Full description',
          multiline: true,
        }),
        published: fields.text({ label: 'Publication year' }),
        amazonAuthorStore: fields.url({ label: 'Amazon author store' }),
        bestseller: fields.object(
          {
            claimed: fields.checkbox({
              label: 'Show the best-seller mark',
              defaultValue: true,
            }),
            label: fields.text({
              label: 'Generic label',
              defaultValue: 'Amazon Best Seller',
            }),
            category: fields.text({
              label: 'Category',
              description:
                'e.g. "Regenerative Medicine". Amazon badges are category-specific — filling this upgrades the mark from the generic label to a precise claim. Leave blank until you have a dated screenshot to back it.',
            }),
            rank: fields.text({
              label: 'Rank',
              description: 'e.g. "1". Optional.',
            }),
            verifiedOn: fields.text({
              label: 'Verified on',
              description: 'Date the badge was captured, e.g. 2026-08-06.',
            }),
          },
          { label: 'Best-seller mark' },
        ),
      },
    }),

    excerpt: singleton({
      label: 'Excerpt',
      path: 'src/content/excerpt/excerpt',
      format: { contentField: 'body' },
      schema: {
        kicker: fields.text({
          label: 'Kicker',
          description: 'Where the passage is from, e.g. "From the introduction".',
        }),
        title: fields.text({ label: 'Title' }),
        body: fields.markdoc({ label: 'Excerpt text' }),
      },
    }),

    author: singleton({
      label: 'Author',
      path: 'src/data/author',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Short name' }),
        fullName: fields.text({ label: 'Full name' }),
        role: fields.text({ label: 'Role' }),
        short: fields.text({ label: 'Short bio', multiline: true }),
        long: fields.text({ label: 'Long bio', multiline: true }),
        credentials: fields.array(
          fields.object({
            label: fields.text({ label: 'Credential' }),
            detail: fields.text({ label: 'Detail' }),
          }),
          {
            label: 'Credentials',
            itemLabel: (props) => props.fields.label.value,
          },
        ),
        personalUrl: fields.url({ label: 'Personal website' }),
        practiceUrl: fields.url({ label: 'Practice website' }),
        social: fields.array(
          fields.object({
            name: fields.text({ label: 'Network' }),
            url: fields.url({ label: 'URL' }),
          }),
          {
            label: 'Social profiles',
            itemLabel: (props) => props.fields.name.value,
          },
        ),
      },
    }),
  },

  collections: {
    hallmarks: collection({
      label: 'Hallmarks of aging',
      slugField: 'name',
      path: 'src/content/hallmarks/*',
      format: { data: 'yaml' },
      columns: ['order', 'name'],
      schema: {
        order: fields.integer({
          label: 'Order',
          validation: { min: 1, max: 9 },
        }),
        name: fields.slug({ name: { label: 'Name' } }),
        summary: fields.text({ label: 'Summary', multiline: true }),
      },
    }),

    formats: collection({
      label: 'Editions',
      slugField: 'name',
      path: 'src/content/formats/*',
      format: { data: 'yaml' },
      columns: ['order', 'name'],
      schema: {
        order: fields.integer({ label: 'Order' }),
        name: fields.slug({ name: { label: 'Format' } }),
        asin: fields.text({ label: 'Amazon ASIN' }),
        isbn: fields.text({ label: 'ISBN' }),
        price: fields.number({ label: 'Price' }),
        currency: fields.text({ label: 'Currency', defaultValue: 'AUD' }),
        url: fields.url({ label: 'Amazon URL' }),
        note: fields.text({ label: 'Note', multiline: true }),
        delivery: fields.text({
          label: 'Delivery',
          description: 'e.g. "Ships from Amazon AU" or "Delivered instantly".',
        }),
        featured: fields.checkbox({
          label: 'Recommended edition',
          description:
            'Marks this edition as the site\'s recommendation. Use on one edition at most.',
          defaultValue: false,
        }),
      },
    }),

    publications: collection({
      label: 'Publications',
      slugField: 'title',
      path: 'src/content/publications/*',
      format: { data: 'yaml' },
      columns: ['year', 'title'],
      schema: {
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        title: fields.slug({ name: { label: 'Title' } }),
        year: fields.integer({ label: 'Year' }),
        journal: fields.text({ label: 'Journal or venue' }),
        url: fields.url({ label: 'Link' }),
        doi: fields.text({ label: 'DOI' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
      },
    }),

    press: collection({
      label: 'Media coverage',
      slugField: 'outlet',
      path: 'src/content/press/*',
      format: { data: 'yaml' },
      columns: ['outlet', 'date'],
      schema: {
        outlet: fields.slug({ name: { label: 'Outlet' } }),
        date: fields.date({ label: 'Date' }),
        url: fields.url({ label: 'Link' }),
        quote: fields.text({ label: 'Pull quote', multiline: true }),
      },
    }),

    endorsements: collection({
      label: 'Endorsements',
      slugField: 'name',
      path: 'src/content/endorsements/*',
      format: { data: 'yaml' },
      columns: ['name', 'title'],
      schema: {
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        name: fields.slug({ name: { label: 'Name' } }),
        title: fields.text({ label: 'Title or affiliation' }),
        quote: fields.text({ label: 'Quote', multiline: true }),
      },
    }),

    faq: collection({
      label: 'FAQ',
      slugField: 'question',
      path: 'src/content/faq/*',
      format: { data: 'yaml' },
      columns: ['question'],
      schema: {
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        question: fields.slug({ name: { label: 'Question' } }),
        answer: fields.text({ label: 'Answer', multiline: true }),
      },
    }),
  },
});
