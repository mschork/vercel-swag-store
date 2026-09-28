import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type Catalogue,
  fetchCatalogue,
  type MirrorDocument,
  planSync,
  syncCatalogue,
} from './catalogue-sync.ts'

const NOW = '2026-09-28T04:00:00.000Z'

const hats = { slug: 'hats', name: 'Hats' }
const beanie = {
  id: 'hat_001',
  name: 'Black Beanie',
  slug: 'black-beanie',
  category: 'hats',
  price: 2400,
  featured: false,
  images: ['https://example.test/beanie.png'],
}
const catalogue: Catalogue = { categories: [hats], products: [beanie] }

/** The mirror as `MIRROR_QUERY` returns it after a sync of `catalogue`. */
const synced: MirrorDocument[] = [
  { _id: 'category-hats', _type: 'category', name: 'Hats', apiSlug: 'hats', missing: false },
  {
    _id: 'product-hat_001',
    _type: 'product',
    name: 'Black Beanie',
    apiId: 'hat_001',
    slug: 'black-beanie',
    category: 'category-hats',
    price: 2400,
    featured: false,
    image: 'https://example.test/beanie.png',
    missing: false,
  },
]

describe('planSync', () => {
  it('writes nothing when the mirror already matches', () => {
    expect(planSync(catalogue, synced, NOW)).toEqual([])
  })

  it('creates a document the mirror lacks, with a category reference', () => {
    const writes = planSync(catalogue, [synced[0]!], NOW)
    expect(writes).toEqual([
      {
        kind: 'create',
        doc: expect.objectContaining({
          _id: 'product-hat_001',
          _type: 'product',
          category: { _type: 'reference', _ref: 'category-hats' },
          missing: false,
          syncedAt: NOW,
        }),
      },
    ])
  })

  it('patches only the fields that differ, and stamps syncedAt on that document', () => {
    const repriced = { ...catalogue, products: [{ ...beanie, price: 2600 }] }
    expect(planSync(repriced, synced, NOW)).toEqual([
      { kind: 'patch', id: 'product-hat_001', set: { price: 2600, syncedAt: NOW } },
    ])
  })

  it('writes a changed category as a reference', () => {
    const moved = { categories: [hats, { slug: 'tops', name: 'Tops' }], products: [{ ...beanie, category: 'tops' }] }
    const patch = planSync(moved, synced, NOW).find((write) => write.kind === 'patch')
    expect(patch).toEqual({
      kind: 'patch',
      id: 'product-hat_001',
      set: { category: { _type: 'reference', _ref: 'category-tops' }, syncedAt: NOW },
    })
  })

  it('never writes an editorial field, so enrichment and intros survive', () => {
    const edited = synced.map((doc) => ({ ...doc, intro: 'Warm heads.', care: [], name: 'Renamed' }))
    const written = planSync(catalogue, edited, NOW).flatMap((write) =>
      Object.keys(write.kind === 'patch' ? write.set : write.doc),
    )
    expect(written).toContain('name')
    for (const editorial of ['intro', 'care', 'extendedDescription', 'gallery', 'faqs']) {
      expect(written).not.toContain(editorial)
    }
  })

  it('flags a document the API no longer returns, once', () => {
    const gone: MirrorDocument = { ...synced[1]!, _id: 'product-hat_002', apiId: 'hat_002' }
    expect(planSync(catalogue, [...synced, gone], NOW)).toEqual([
      { kind: 'patch', id: 'product-hat_002', set: { missing: true, syncedAt: NOW } },
    ])
    expect(planSync(catalogue, [...synced, { ...gone, missing: true }], NOW)).toEqual([])
  })

  it('clears the flag on a document that comes back', () => {
    const flagged = synced.map((doc) => (doc._type === 'product' ? { ...doc, missing: true } : doc))
    expect(planSync(catalogue, flagged, NOW)).toEqual([
      { kind: 'patch', id: 'product-hat_001', set: { missing: false, syncedAt: NOW } },
    ])
  })

  it('flags nothing when the API returns no products or no categories', () => {
    expect(planSync({ categories: [hats], products: [] }, synced, NOW)).toEqual([])
    expect(planSync({ categories: [], products: [] }, synced, NOW)).toEqual([])
  })

  it('treats a product without images as image null, matching a mirror without one', () => {
    const bare = { ...catalogue, products: [{ ...beanie, images: [] }] }
    const mirror = synced.map((doc) => (doc._type === 'product' ? { ...doc, image: undefined } : doc))
    expect(planSync(bare, mirror, NOW)).toEqual([])
  })
})

describe('syncCatalogue', () => {
  const client = (mirror: MirrorDocument[]) => {
    const transaction = { createIfNotExists: vi.fn(), patch: vi.fn(), commit: vi.fn(), createOrReplace: vi.fn() }
    return { transaction, client: { fetch: vi.fn(async () => mirror), transaction: vi.fn(() => transaction) } }
  }

  it('opens no transaction when nothing changed', async () => {
    const { client: sanity } = client(synced)
    const result = await syncCatalogue(sanity as never, catalogue, new Date(NOW))
    expect(sanity.transaction).not.toHaveBeenCalled()
    expect(result).toEqual({ created: 0, updated: 0, flagged: 0, categorySlugs: ['hats'] })
  })

  it('commits creates and patches in one transaction and never replaces a document', async () => {
    const repriced: MirrorDocument = { ...synced[1]!, price: 1 }
    const gone: MirrorDocument = { ...synced[1]!, _id: 'product-hat_002' }
    const { client: sanity, transaction } = client([synced[0]!, repriced, gone])
    const result = await syncCatalogue(
      sanity as never,
      { ...catalogue, products: [beanie, { ...beanie, id: 'hat_003', slug: 'hat-3' }] },
      new Date(NOW),
    )
    expect(result).toMatchObject({ created: 1, updated: 1, flagged: 1 })
    expect(transaction.commit).toHaveBeenCalledOnce()
    expect(transaction.createOrReplace).not.toHaveBeenCalled()
  })
})

describe('fetchCatalogue', () => {
  afterEach(() => vi.unstubAllGlobals())

  const answer = (data: unknown, hasNextPage = false) =>
    Response.json({ success: true, data, meta: { pagination: { hasNextPage } } })

  it('follows hasNextPage and sends the bypass header', async () => {
    const fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/categories')) return answer([hats])
      return url.includes('page=1&') ? answer([beanie], true) : answer([{ ...beanie, id: 'hat_002' }])
    })
    vi.stubGlobal('fetch', fetch)
    const result = await fetchCatalogue({ baseUrl: 'https://api.test', bypassToken: 'secret' })
    expect(result.products.map((product) => product.id)).toEqual(['hat_001', 'hat_002'])
    expect(fetch).toHaveBeenCalledWith('https://api.test/products?page=2&limit=50', {
      headers: { 'x-vercel-protection-bypass': 'secret' },
    })
  })

  it('throws on a failed page, so a partial catalogue is never synced', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/categories') ? answer([hats]) : new Response('down', { status: 503 }),
      ),
    )
    await expect(fetchCatalogue({ baseUrl: 'https://api.test', bypassToken: 's' })).rejects.toThrow('503')
  })

  it('throws on an answer without a list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: false })))
    await expect(fetchCatalogue({ baseUrl: 'https://api.test', bypassToken: 's' })).rejects.toThrow(
      'without a list',
    )
  })
})
