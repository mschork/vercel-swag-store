import type { SanityClient } from '@sanity/client'

/**
 * The catalogue sync: brings the mirrored fields of every product and category
 * document in line with the API
 * (docs/adr/0003-sanity-mirrors-api-products-and-categories.md,
 * specs/E15-catalog-sync.md). It writes only fields that differ, so an
 * unchanged catalogue produces no revision and no webhook call.
 *
 * Run by `scripts/sync.ts` and by the `catalogue-sync` Sanity Function.
 */

export interface ApiCategory {
  slug: string
  name: string
}

export interface ApiProduct {
  id: string
  slug: string
  name: string
  category: string
  price: number
  featured: boolean
  images: string[]
}

export interface Catalogue {
  categories: ApiCategory[]
  products: ApiProduct[]
}

/**
 * No dots in an id: Sanity reads everything before a dot as a document path,
 * the way `drafts.` works, and a document on a path is invisible to an
 * unauthenticated reader. The store reads this dataset without a token.
 */
export const categoryId = (slug: string) => `category-${slug}`
export const productId = (apiId: string) => `product-${apiId}`

/** Products per API page; the sync follows `hasNextPage`, whatever the total. */
const PAGE_SIZE = 50

interface ApiAccess {
  baseUrl: string
  bypassToken: string
}

/** The API answers `{ success, data, meta }`; lists carry pagination in `meta`. */
async function api<T>(
  { baseUrl, bypassToken }: ApiAccess,
  path: string,
): Promise<{ data: T[]; hasNextPage: boolean }> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-vercel-protection-bypass': bypassToken },
  })
  if (!response.ok) throw new Error(`API ${path} answered ${response.status}`)
  const body = (await response.json()) as {
    data?: unknown
    meta?: { pagination?: { hasNextPage?: boolean } }
  }
  if (!Array.isArray(body.data)) throw new Error(`API ${path} answered without a list`)
  return { data: body.data as T[], hasNextPage: body.meta?.pagination?.hasNextPage === true }
}

/** Every category and product. Throws on any failed request, so a partial catalogue is never synced. */
export async function fetchCatalogue(access: ApiAccess): Promise<Catalogue> {
  const [{ data: categories }, products] = await Promise.all([
    api<ApiCategory>(access, '/categories'),
    (async () => {
      const all: ApiProduct[] = []
      for (let page = 1; ; page++) {
        const { data, hasNextPage } = await api<ApiProduct>(
          access,
          `/products?page=${page}&limit=${PAGE_SIZE}`,
        )
        all.push(...data)
        if (!hasNextPage) return all
      }
    })(),
  ])
  return { categories, products }
}

/** The mirrored fields of one document as the dataset holds them, flattened for comparison. */
export interface MirrorDocument {
  _id: string
  _type: 'product' | 'category'
  [field: string]: unknown
}

export const MIRROR_QUERY = `*[_type in ["product", "category"]]{
  _id, _type, name, apiSlug, apiId, slug, "category": category._ref,
  price, featured, image, missing
}`

type Fields = Record<string, unknown>

export type MirrorWrite =
  | { kind: 'create'; doc: { _id: string; _type: 'product' | 'category' } & Fields }
  | { kind: 'patch'; id: string; set: Fields }

function categoryFields(category: ApiCategory): Fields {
  return { name: category.name, apiSlug: category.slug, missing: false }
}

function productFields(product: ApiProduct): Fields {
  return {
    name: product.name,
    apiId: product.id,
    slug: product.slug,
    category: categoryId(product.category),
    price: product.price,
    featured: product.featured,
    image: product.images[0] ?? null,
    missing: false,
  }
}

/** A category reference is compared by id and written as a reference. */
function toWritten(fields: Fields): Fields {
  if (typeof fields.category !== 'string') return fields
  return { ...fields, category: { _type: 'reference', _ref: fields.category } }
}

/** A field the dataset has never held counts as `null`, so `image: null` matches an absent image. */
function changed(current: MirrorDocument, wanted: Fields): Fields {
  const diff: Fields = {}
  for (const [field, value] of Object.entries(wanted)) {
    if ((current[field] ?? null) !== value) diff[field] = value
  }
  return diff
}

/**
 * The writes that bring the mirror in line with the catalogue. A new document
 * is created; an existing one is patched with only the fields that differ,
 * never replaced, so what an editor wrote beside them survives. A document the
 * catalogue no longer lists is flagged `missing`, unless the catalogue came
 * back empty, which is read as an API fault rather than an empty shop.
 */
export function planSync(
  catalogue: Catalogue,
  mirror: readonly MirrorDocument[],
  syncedAt: string,
): MirrorWrite[] {
  const byId = new Map(mirror.map((doc) => [doc._id, doc]))
  const wanted = new Map<string, { type: 'product' | 'category'; fields: Fields }>()
  for (const category of catalogue.categories) {
    wanted.set(categoryId(category.slug), { type: 'category', fields: categoryFields(category) })
  }
  for (const product of catalogue.products) {
    wanted.set(productId(product.id), { type: 'product', fields: productFields(product) })
  }

  const writes: MirrorWrite[] = []
  for (const [id, { type, fields }] of wanted) {
    const current = byId.get(id)
    if (!current) {
      writes.push({ kind: 'create', doc: { _id: id, _type: type, ...toWritten(fields), syncedAt } })
      continue
    }
    const diff = changed(current, fields)
    if (Object.keys(diff).length > 0) {
      writes.push({ kind: 'patch', id, set: { ...toWritten(diff), syncedAt } })
    }
  }

  const complete = catalogue.categories.length > 0 && catalogue.products.length > 0
  if (complete) {
    for (const doc of mirror) {
      if (!wanted.has(doc._id) && doc.missing !== true) {
        writes.push({ kind: 'patch', id: doc._id, set: { missing: true, syncedAt } })
      }
    }
  }
  return writes
}

export interface SyncResult {
  created: number
  updated: number
  flagged: number
  categorySlugs: string[]
}

/**
 * Reads the mirror, plans the writes and commits them in one transaction.
 * Writes nothing when nothing changed.
 */
export async function syncCatalogue(
  client: Pick<SanityClient, 'fetch' | 'transaction'>,
  catalogue: Catalogue,
  now: Date = new Date(),
): Promise<SyncResult> {
  const mirror = await client.fetch<MirrorDocument[]>(MIRROR_QUERY)
  const writes = planSync(catalogue, mirror, now.toISOString())

  const result: SyncResult = {
    created: 0,
    updated: 0,
    flagged: 0,
    categorySlugs: catalogue.categories.map((category) => category.slug),
  }
  if (writes.length === 0) return result

  const transaction = client.transaction()
  for (const write of writes) {
    if (write.kind === 'create') {
      // Never replaces: a run that raced this one may have created it already.
      transaction.createIfNotExists(write.doc)
      result.created++
    } else {
      transaction.patch(write.id, { set: write.set })
      if (write.set.missing === true) result.flagged++
      else result.updated++
    }
  }
  await transaction.commit()
  return result
}
