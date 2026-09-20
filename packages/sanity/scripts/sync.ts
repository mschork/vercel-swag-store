import { createClient } from '@sanity/client'
import { required } from './env.ts'

/**
 * Mirrors the API's categories and products into Sanity
 * (docs/adr/0003-sanity-mirrors-api-products-and-categories.md).
 *
 * Only catalogue fields are written, so an editor's work is never touched: the
 * script patches the mirrored fields and sets them on create, and leaves
 * everything else alone. Documents whose product or category the API no longer
 * returns are flagged rather than deleted.
 *
 * Run with `pnpm --filter @repo/sanity sync`.
 */

interface ApiCategory {
  slug: string
  name: string
}

interface ApiProduct {
  id: string
  slug: string
  name: string
  category: string
  price: number
  featured: boolean
  images: string[]
}

/**
 * No dots in an id: Sanity reads everything before a dot as a document path,
 * the way `drafts.` works, and a document on a path is invisible to an
 * unauthenticated reader. The store reads this dataset without a token.
 */
export const categoryId = (slug: string) => `category-${slug}`
const productId = (apiId: string) => `product-${apiId}`

interface Pagination {
  hasNextPage: boolean
}

/** The API answers `{ success, data, meta }`; lists carry pagination in `meta`. */
async function api<T>(path: string): Promise<{ data: T; meta?: { pagination?: Pagination } }> {
  const response = await fetch(`${required('API_BASE_URL')}${path}`, {
    headers: { 'x-vercel-protection-bypass': required('API_BYPASS_TOKEN') },
  })
  if (!response.ok) throw new Error(`API ${path} answered ${response.status}`)
  return (await response.json()) as { data: T; meta?: { pagination?: Pagination } }
}

/** Every product, following the API's pagination rather than assuming a count. */
async function allProducts(): Promise<ApiProduct[]> {
  const products: ApiProduct[] = []
  for (let page = 1; ; page++) {
    const { data, meta } = await api<ApiProduct[]>(`/products?page=${page}&limit=50`)
    products.push(...data)
    if (!meta?.pagination?.hasNextPage) return products
  }
}

/** The two transaction calls the mirror needs; narrow so a test can stand in for the client. */
type MirrorTransaction = {
  createIfNotExists(doc: { _id: string; _type: string } & Record<string, unknown>): unknown
  patch(id: string, operations: { set: Record<string, unknown> }): unknown
}

/**
 * Queues the mirror writes. Every document is created with the catalogue
 * fields, or patched with only those when it exists, so what an editor wrote
 * beside them (a product's enrichment, a category's intro) survives every
 * sync. Never `createOrReplace`: that would replace the editor's fields too.
 */
export function queueCatalogue(
  transaction: MirrorTransaction,
  {
    categories,
    products,
    syncedAt,
  }: { categories: readonly ApiCategory[]; products: readonly ApiProduct[]; syncedAt: string },
) {
  for (const category of categories) {
    const fields = {
      name: category.name,
      apiSlug: category.slug,
      syncedAt,
      missing: false,
    }
    transaction.createIfNotExists({ _id: categoryId(category.slug), _type: 'category', ...fields })
    transaction.patch(categoryId(category.slug), { set: fields })
  }

  for (const product of products) {
    const fields = {
      name: product.name,
      apiId: product.id,
      slug: product.slug,
      category: { _type: 'reference' as const, _ref: categoryId(product.category) },
      price: product.price,
      featured: product.featured,
      image: product.images[0] ?? null,
      syncedAt,
      missing: false,
    }
    transaction.createIfNotExists({ _id: productId(product.id), _type: 'product', ...fields })
    transaction.patch(productId(product.id), { set: fields })
  }
}

export async function syncCatalogue() {
  const client = createClient({
    projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: required('NEXT_PUBLIC_SANITY_DATASET'),
    token: required('SANITY_API_WRITE_TOKEN'),
    apiVersion: '2026-09-01',
    useCdn: false,
  })

  const [{ data: categories }, products] = await Promise.all([
    api<ApiCategory[]>('/categories'),
    allProducts(),
  ])
  const syncedAt = new Date().toISOString()
  const transaction = client.transaction()

  queueCatalogue(transaction, { categories, products, syncedAt })

  await transaction.commit()

  const gone = await client.fetch<{ _id: string; _type: string }[]>(
    `*[_type in ["product", "category"] && (!defined(syncedAt) || syncedAt < $syncedAt) && missing != true]{_id, _type}`,
    { syncedAt },
  )
  if (gone.length > 0) {
    const flag = client.transaction()
    for (const doc of gone) flag.patch(doc._id, { set: { missing: true } })
    await flag.commit()
  }

  return {
    categories: categories.length,
    products: products.length,
    flagged: gone.length,
    categorySlugs: categories.map((category) => category.slug),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await syncCatalogue()
  console.log(
    `Synced ${result.categories} categories and ${result.products} products` +
      (result.flagged > 0 ? `, flagged ${result.flagged} as gone from the API` : ''),
  )
}
