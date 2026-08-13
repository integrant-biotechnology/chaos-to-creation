import { getCollection } from 'astro:content';
import book from '../data/book.json';
import author from '../data/author.json';

const SITE = 'https://chaostocreation.com.au';

const AUTHOR_ID = `${SITE}/#author`;
const BOOK_ID = `${SITE}/#book`;

/**
 * `sameAs` across Google Scholar, ResearchGate, LinkedIn and the rest is the
 * strongest entity signal available for an academic author — it lets search
 * engines reconcile this page with an already-established researcher identity.
 */
export function personNode() {
  return {
    '@type': 'Person',
    '@id': AUTHOR_ID,
    name: author.fullName,
    alternateName: author.name,
    jobTitle: author.role,
    description: author.short,
    url: `${SITE}/author/`,
    sameAs: [...author.social.map((s) => s.url), author.practiceUrl],
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'University of Technology Sydney',
    },
  };
}

export async function bookNode() {
  const formats = (await getCollection('formats')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  return {
    '@type': 'Book',
    '@id': BOOK_ID,
    name: book.title,
    alternateName: `${book.title}: ${book.subtitle}`,
    description: book.description,
    author: { '@id': AUTHOR_ID },
    inLanguage: 'en',
    datePublished: book.published,
    url: `${SITE}/the-book/`,
    workExample: formats.map((f) => ({
      '@type': 'Book',
      bookFormat: `https://schema.org/${
        f.data.name === 'Kindle' ? 'EBook' : f.data.name
      }`,
      ...(f.data.isbn ? { isbn: f.data.isbn } : {}),
      potentialAction: {
        '@type': 'ReadAction',
        target: f.data.url,
      },
      offers: {
        '@type': 'Offer',
        price: f.data.price,
        priceCurrency: f.data.currency,
        availability: 'https://schema.org/InStock',
        url: f.data.url,
      },
    })),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: SITE,
    name: book.title,
    description: book.tagline,
    inLanguage: 'en-AU',
    publisher: { '@id': AUTHOR_ID },
  };
}

export async function faqNode() {
  const faq = (await getCollection('faq')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.data.question,
      acceptedAnswer: { '@type': 'Answer', text: f.data.answer },
    })),
  };
}

export function breadcrumbNode(
  trail: Array<{ name: string; path: string }>,
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE}${t.path}`,
    })),
  };
}
