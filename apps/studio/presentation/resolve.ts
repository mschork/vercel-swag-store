import { map } from 'rxjs'
import {
  defineDocuments,
  type DocumentLocationResolver,
  type DocumentLocationsState,
  type PresentationPluginOptions,
} from 'sanity/presentation'

/**
 * Where each document shows in the store (E17), so an editor can jump from a
 * document to the page it appears on, and the Presentation tool knows which
 * document a page is mainly about.
 *
 * Only types an editor writes in are listed. A `category` is mostly a mirror
 * of the API, but its intro shows on its product listing (E18). `searchGap`
 * and `productIdea` have no entry on purpose: they never reach a page.
 */

const HOME = { title: 'Home page', href: '/' }

type ProductRef = { name?: string | null; slug?: string | null }

const productPage = (product: ProductRef) => ({
  title: product.name || 'Product page',
  href: `/products/${product.slug}`,
})

const withSlug = (products: readonly ProductRef[] | null | undefined) =>
  (products ?? []).filter((product) => Boolean(product?.slug))

/** A testimonial shows on every product it names, and counts towards People's favourites on the home page. */
export function testimonialLocations(
  doc: { products?: ProductRef[] | null } | null,
): DocumentLocationsState {
  const products = withSlug(doc?.products)
  if (products.length === 0) {
    return { message: 'Shows nowhere yet: name a product to put it on that page.', tone: 'caution' }
  }
  return {
    locations: [...products.map(productPage), HOME],
    message: 'On each product it names, and counted for People’s favourites on the home page.',
    tone: 'positive',
  }
}

/**
 * A question shows on the products that attach it. One answered for whole
 * categories shows on every product in them, which is a message rather than
 * a list that could run to the whole catalogue.
 */
export function faqLocations(
  doc: { categories?: (string | null)[] | null; products?: ProductRef[] | null } | null,
): DocumentLocationsState {
  const categories = (doc?.categories ?? []).filter((name): name is string => Boolean(name))
  const products = withSlug(doc?.products)
  const onCategories =
    categories.length > 0 ? `On every product in ${categories.join(', ')}.` : undefined
  if (products.length === 0) {
    return onCategories
      ? { message: onCategories, tone: 'positive' }
      : { message: 'Shows nowhere yet: give it a category or attach it to a product.', tone: 'caution' }
  }
  return {
    locations: products.map(productPage),
    message: onCategories ? `${onCategories} Also attached to:` : undefined,
    tone: 'positive',
  }
}

/** A product shows on its own page, at the slug the sync script mirrors. */
export function productLocations(doc: ProductRef | null): DocumentLocationsState {
  return doc?.slug
    ? { locations: [productPage(doc)] }
    : { message: 'No page yet: the sync script has not given it a slug.', tone: 'caution' }
}

/** A category's intro shows on its product listing, at the slug the sync script mirrors. */
export function categoryLocations(
  doc: { name?: string | null; apiSlug?: string | null } | null,
): DocumentLocationsState {
  return doc?.apiSlug
    ? {
        locations: [
          { title: doc.name || 'Category page', href: `/products/category/${doc.apiSlug}` },
        ],
        message: 'The intro shows under the heading of this page.',
        tone: 'positive',
      }
    : { message: 'No page yet: the sync script has not given it a slug.', tone: 'caution' }
}

const PRODUCTS = `{ name, slug }`

/**
 * One query and one reading of its answer per type. A query rather than
 * `select`, because a question's products are found by who references it,
 * which `select` cannot follow.
 */
const QUERIED: Record<string, { query: string; read: (doc: never) => DocumentLocationsState }> = {
  product: { query: `*[_id == $id][0]${PRODUCTS}`, read: productLocations },
  category: { query: `*[_id == $id][0]{ name, apiSlug }`, read: categoryLocations },
  testimonial: {
    query: `*[_id == $id][0]{ "products": products[]->${PRODUCTS} }`,
    read: testimonialLocations,
  },
  faq: {
    query: `*[_id == $id][0]{
      "categories": categories[]->name,
      "products": *[_type == "product" && references(^._id)] | order(name asc) ${PRODUCTS}
    }`,
    read: faqLocations,
  },
}

const FIXED: Record<string, DocumentLocationsState> = {
  homePage: { locations: [HOME] },
  siteSettings: {
    locations: [HOME],
    message: 'The footer and the metadata of every page; the headings on every product page.',
  },
  checkoutPage: { locations: [{ title: 'Checkout', href: '/checkout' }] },
}

const locations: DocumentLocationResolver = ({ id, type, perspectiveStack }, { documentStore }) => {
  const queried = QUERIED[type]
  if (!queried) return FIXED[type] ?? null
  return documentStore
    .listenQuery(queried.query, { id }, { perspective: perspectiveStack })
    .pipe(map((doc) => queried.read(doc as never)))
}

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/', filter: `_type == "homePage"` },
    { route: '/checkout', filter: `_type == "checkoutPage"` },
    { route: '/products/category/:slug', filter: `_type == "category" && apiSlug == $slug` },
    { route: '/products/:slug', filter: `_type == "product" && slug == $slug` },
  ]),
  locations,
}
