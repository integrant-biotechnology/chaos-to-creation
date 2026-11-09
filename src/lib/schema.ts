import { getCollection } from 'astro:content';
import book from '../data/book.json';
import author from '../data/author.json';
import { SITE, abs, pageFor } from './seo';

/**
 * Structured data. Every page emits ONE connected @graph:
 *
 *   WebSite ─ about ─▶ Book ─ author ─▶ Person ◀─ about ─ WebPage ─▶ BreadcrumbList
 *
 * The Person node deliberately uses the @id of the author's personal site
 * (profgordonslater.com.au), which describes the same person with the same
 * @id. Search engines can then treat the author on both sites as one entity
 * instead of two people who happen to share a name.
 */

type Node = Record<string, unknown>;

export const WEBSITE_ID = `${SITE}/#website`;
export const BOOK_ID = `${SITE}/#book`;
export const PERSON_ID = 'https://profgordonslater.com.au/#person';
const PERSON_URL = 'https://profgordonslater.com.au/';
const PERSONAL_BOOK_PAGE = 'https://profgordonslater.com.au/book';

const ref = (id: string) => ({ '@id': id });

export function personNode(): Node {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Prof Gordon Slater',
    givenName: 'Gordon',
    familyName: 'Slater',
    honorificPrefix: 'Prof',
    alternateName: ['Professor Gordon Slater', 'Gordon Slater'],
    url: PERSON_URL,
    image: abs('/portrait-gordon-slater-hero.jpg'),
    jobTitle: 'Orthopaedic surgeon',
    description: author.short,
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'University of Technology Sydney',
    },
    sameAs: [...author.social.map((s) => s.url), author.practiceUrl],
  };
}

const FORMAT_TYPE: Record<string, string> = {
  Hardcover: 'https://schema.org/Hardcover',
  Paperback: 'https://schema.org/Paperback',
  Kindle: 'https://schema.org/EBook',
};

export async function bookNode(): Promise<Node> {
  const formats = (await getCollection('formats')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  return {
    '@type': 'Book',
    '@id': BOOK_ID,
    name: `${book.title}: ${book.subtitle}`,
    alternateName: book.title,
    description: book.description,
    author: ref(PERSON_ID),
    datePublished: book.datePublished,
    inLanguage: 'en',
    image: abs('/cover-chaos-to-creation.png'),
    url: abs('/the-book/'),
    bookFormat: formats.map((f) => FORMAT_TYPE[f.data.name]),
    // Prices and availability come from src/content/formats, which is kept in
    // step with the Amazon AU listing. No ratings or reviews: none are
    // maintained here, and none may be invented.
    workExample: formats.map((f) => ({
      '@type': 'Book',
      name: `${book.title} (${f.data.name})`,
      bookFormat: FORMAT_TYPE[f.data.name],
      ...(f.data.isbn ? { isbn: f.data.isbn } : {}),
      url: f.data.url,
      offers: {
        '@type': 'Offer',
        price: f.data.price.toFixed(2),
        priceCurrency: f.data.currency,
        availability: 'https://schema.org/InStock',
        url: f.data.url,
        seller: { '@type': 'Organization', name: 'Amazon Australia' },
      },
    })),
    sameAs: [
      ...formats.map((f) => f.data.url),
      ...(book.googleBooksUrl ? [book.googleBooksUrl] : []),
      PERSONAL_BOOK_PAGE,
    ],
  };
}

export function websiteNode(): Node {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: book.title,
    description: book.tagline,
    inLanguage: 'en-AU',
    about: ref(BOOK_ID),
    publisher: ref(PERSON_ID),
  };
}

export async function faqNode(slugs?: string[]): Promise<Node> {
  const faq = (await getCollection('faq'))
    .filter((f) => !slugs || slugs.includes(f.id))
    .sort((a, b) => a.data.order - b.data.order);

  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.data.question,
      acceptedAnswer: { '@type': 'Answer', text: f.data.answer },
    })),
  };
}

/** Pages whose subject is the author rather than the book. */
const ABOUT_PERSON = new Set(['/author/', '/research/']);

/**
 * The full graph for one page: the shared site/book/person nodes, the page
 * itself, its breadcrumb trail (not on the home page) and any page-specific
 * extras such as an FAQPage.
 */
export async function pageGraph(path: string, extra: Node[] = []): Promise<Node[]> {
  const page = pageFor(path);
  const url = abs(path);
  const crumbs = path === '/' ? [] : [pageFor('/'), page];
  const breadcrumbId = `${url}#breadcrumb`;

  const webPage: Node = {
    '@type': path === '/author/' ? 'ProfilePage' : 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: 'en-AU',
    isPartOf: ref(WEBSITE_ID),
    about: ref(ABOUT_PERSON.has(path) ? PERSON_ID : BOOK_ID),
    ...(path === '/author/' ? { mainEntity: ref(PERSON_ID) } : {}),
    ...(crumbs.length ? { breadcrumb: ref(breadcrumbId) } : {}),
  };

  const nodes: Node[] = [websiteNode(), await bookNode(), personNode(), webPage];

  if (crumbs.length) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.breadcrumb,
        item: abs(c.path),
      })),
    });
  }

  return [...nodes, ...extra];
}

/**
 * Serialise for a <script type="application/ld+json"> block. Escaping `<`
 * means no string in the data (an FAQ answer, a CMS field) can close the
 * script element early.
 */
export function serializeGraph(nodes: Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })
    .replace(/</g, '\\u003c')
    .replace(/[\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`);
}
