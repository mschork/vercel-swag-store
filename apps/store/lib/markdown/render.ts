import type { Category, Product } from '@/lib/api/types'
import type { ProductHeadings } from '@/lib/content/fallbacks'
import { formatPrice } from '@/lib/format'
import type { MergedProduct } from '@/lib/sanity/merge'
import { markdownPath } from './paths'
import { escapeMarkdown, portableTextToMarkdown } from './portable-text'

/**
 * The Markdown version of each catalogue page (specs/E20-ai-crawlers.md):
 * what the page shows, minus anything per visitor. Pure functions over the
 * data the pages render, so they are tested without a server.
 *
 * Every file opens with its h1 and a link to its HTML page; every other
 * internal link goes to a `.md` address. Links are absolute, because a reader
 * handed the text alone has no base URL.
 */

/** A photo with the words that describe it; `alt` may be empty. */
export interface MarkdownPhoto {
  src: string
  alt: string
}

/** One testimonial as the Markdown shows it: words and who said them, no photo. */
export interface MarkdownTestimonial {
  quote?: string | null
  person?: string | null
  role?: string | null
}

const MORE_PHOTOS_HEADING = 'More photos'

const absolute = (path: string, siteUrl: string) => new URL(path, siteUrl).href
const markdownUrl = (pagePath: string, siteUrl: string) => absolute(markdownPath(pagePath), siteUrl)
const link = (text: string, href: string) => `[${escapeMarkdown(text)}](${href})`
const image = ({ src, alt }: MarkdownPhoto) => `![${escapeMarkdown(alt)}](${src})`
const document = (parts: (string | null | false | undefined)[]) =>
  `${parts.filter(Boolean).join('\n\n')}\n`

/** Title, the link to the HTML page, then whatever follows. */
function opening(title: string, pagePath: string, label: string, siteUrl: string): string[] {
  return [`# ${escapeMarkdown(title)}`, link(label, absolute(pagePath, siteUrl))]
}

/** One product as a list item: name, price and the link to its Markdown version. */
function productItem(product: Pick<Product, 'name' | 'slug' | 'price' | 'currency'>, siteUrl: string) {
  const href = markdownUrl(`/products/${product.slug}`, siteUrl)
  return `- ${link(product.name, href)}: ${formatPrice(product.price, product.currency)}`
}

const productList = (products: readonly Product[], siteUrl: string) =>
  products.map((product) => productItem(product, siteUrl)).join('\n')

function quoteBlock({ quote, person, role }: MarkdownTestimonial): string | null {
  if (!quote || !person) return null
  const words = escapeMarkdown(quote)
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
  const who = [person, role].filter(Boolean).map((part) => escapeMarkdown(String(part)))
  return `${words}\n>\n> — ${who.join(', ')}`
}

export function productMarkdown({
  product,
  categoryName,
  photos,
  testimonials,
  headings,
  siteUrl,
}: {
  product: MergedProduct
  categoryName: string
  /** The gallery in page order: the API's photos, then the editor's. */
  photos: readonly MarkdownPhoto[]
  testimonials: readonly MarkdownTestimonial[]
  headings: ProductHeadings
  siteUrl: string
}): string {
  const [first, ...rest] = photos
  const about = portableTextToMarkdown(product.extendedDescription)
  const care = portableTextToMarkdown(product.care)
  const quotes = testimonials.map(quoteBlock).filter(Boolean)
  const section = (heading: string, body: string | false) =>
    body ? `## ${escapeMarkdown(heading)}\n\n${body}` : null
  return document([
    ...opening(product.name, `/products/${product.slug}`, 'View this product in the store', siteUrl),
    [
      `- Price: ${formatPrice(product.price, product.currency)}`,
      `- Category: ${link(categoryName, markdownUrl(`/products/category/${product.category}`, siteUrl))}`,
    ].join('\n'),
    escapeMarkdown(product.description),
    first ? image(first) : null,
    section(headings.about, about),
    section(headings.care, care),
    section(MORE_PHOTOS_HEADING, rest.length > 0 && rest.map(image).join('\n\n')),
    section(
      headings.faq,
      product.faqs.length > 0 &&
        product.faqs
          .map((faq) => `### ${escapeMarkdown(faq.question)}\n\n${portableTextToMarkdown(faq.answer)}`)
          .join('\n\n'),
    ),
    section(headings.testimonials, quotes.length > 0 && quotes.join('\n\n')),
  ])
}

/** `/products` when `category` is `null`, one category's listing otherwise. */
export function listingMarkdown({
  category,
  intro,
  products,
  categories,
  siteUrl,
}: {
  category: Category | null
  intro?: string | null
  products: readonly Product[]
  categories: readonly Category[]
  siteUrl: string
}): string {
  const path = category ? `/products/category/${category.slug}` : '/products'
  const others = categories.filter((entry) => entry.slug !== category?.slug)
  return document([
    ...opening(category?.name ?? 'All products', path, 'View this page in the store', siteUrl),
    intro ? escapeMarkdown(intro) : null,
    products.length > 0
      ? productList(products, siteUrl)
      : `Nothing in ${escapeMarkdown(category?.name ?? 'the store')} right now.`,
    '## Categories',
    [
      category ? `- ${link('All products', markdownUrl('/products', siteUrl))}` : null,
      ...others.map(
        (entry) => `- ${link(entry.name, markdownUrl(`/products/category/${entry.slug}`, siteUrl))}`,
      ),
    ]
      .filter(Boolean)
      .join('\n'),
  ])
}

export function homeMarkdown({
  storeName,
  hero,
  featured,
  favourites,
  categories,
  siteUrl,
}: {
  storeName: string
  hero: { headline: string; description: string }
  featured: { heading: string; products: readonly Product[] }
  favourites: { heading: string; products: readonly Product[] }
  categories: readonly Category[]
  siteUrl: string
}): string {
  const products = (group: { heading: string; products: readonly Product[] }) =>
    group.products.length > 0
      ? `## ${escapeMarkdown(group.heading)}\n\n${productList(group.products, siteUrl)}`
      : null
  return document([
    ...opening(storeName, '/', 'Visit the store', siteUrl),
    `**${escapeMarkdown(hero.headline)}** ${escapeMarkdown(hero.description)}`,
    products(featured),
    products(favourites),
    '## Categories',
    [
      `- ${link('All products', markdownUrl('/products', siteUrl))}`,
      ...categories.map(
        (entry) => `- ${link(entry.name, markdownUrl(`/products/category/${entry.slug}`, siteUrl))}`,
      ),
    ].join('\n'),
  ])
}

/**
 * `llms.txt`: the index of the Markdown versions. Its first paragraph says
 * what the site is, because a reader may see nothing else.
 */
export function llmsTxt({
  storeName,
  description,
  products,
  categories,
  siteUrl,
}: {
  storeName: string
  description: string
  products: readonly Product[]
  categories: readonly Category[]
  siteUrl: string
}): string {
  return document([
    `# ${escapeMarkdown(storeName)}`,
    `> ${escapeMarkdown(description)}`,
    'This site is a demonstration built for a demonstration project. The products are invented, nothing can be bought, and the site asks not to be indexed or used for training. Every catalogue page has a Markdown version at its own address plus `.md`.',
    '## Store',
    [
      `- ${link('Home', markdownUrl('/', siteUrl))}`,
      `- ${link('All products', markdownUrl('/products', siteUrl))}`,
    ].join('\n'),
    '## Categories',
    categories
      .map((entry) => `- ${link(entry.name, markdownUrl(`/products/category/${entry.slug}`, siteUrl))}`)
      .join('\n'),
    '## Products',
    productList(products, siteUrl),
  ])
}
