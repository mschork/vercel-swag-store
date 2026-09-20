import { describe, expect, it, vi } from 'vitest'
import { CATEGORY_INTROS, queueCategoryIntros } from './category-intros.ts'
import { queueCatalogue } from './sync.ts'

const product = {
  id: 'hat_001',
  name: 'Black Beanie',
  slug: 'black-beanie',
  category: 'hats',
  price: 2400,
  featured: false,
  images: ['https://example.test/beanie.png'],
}

describe('queueCatalogue', () => {
  it('creates or patches each mirror and never replaces a document', () => {
    const transaction = { createIfNotExists: vi.fn(), patch: vi.fn(), createOrReplace: vi.fn() }
    queueCatalogue(transaction, {
      categories: [{ slug: 'hats', name: 'Hats' }],
      products: [product],
      syncedAt: '2026-09-20T10:00:00.000Z',
    })
    expect(transaction.createOrReplace).not.toHaveBeenCalled()
    expect(transaction.createIfNotExists).toHaveBeenCalledTimes(2)
    expect(transaction.patch).toHaveBeenCalledWith('category-hats', {
      set: { name: 'Hats', apiSlug: 'hats', syncedAt: '2026-09-20T10:00:00.000Z', missing: false },
    })
  })

  it('writes only catalogue fields, so an intro or enrichment survives a sync', () => {
    const transaction = { createIfNotExists: vi.fn(), patch: vi.fn() }
    queueCatalogue(transaction, {
      categories: [{ slug: 'hats', name: 'Hats' }],
      products: [product],
      syncedAt: 'now',
    })
    const written = transaction.patch.mock.calls.flatMap(([, operations]) =>
      Object.keys((operations as { set: Record<string, unknown> }).set),
    )
    for (const editorial of ['intro', 'care', 'extendedDescription', 'gallery', 'faqs']) {
      expect(written).not.toContain(editorial)
    }
  })
})

describe('queueCategoryIntros', () => {
  it('uses setIfMissing, so an editor’s intro is never replaced', () => {
    const transaction = { patch: vi.fn() }
    const queued = queueCategoryIntros(transaction, ['hats'])
    expect(queued).toBe(1)
    expect(transaction.patch).toHaveBeenCalledWith('category-hats', {
      setIfMissing: { intro: CATEGORY_INTROS.hats },
    })
  })

  it('skips a category it has no copy for', () => {
    const transaction = { patch: vi.fn() }
    expect(queueCategoryIntros(transaction, ['umbrellas'])).toBe(0)
    expect(transaction.patch).not.toHaveBeenCalled()
  })

  it('keeps every intro within the schema’s 200 characters', () => {
    for (const intro of Object.values(CATEGORY_INTROS)) expect(intro.length).toBeLessThanOrEqual(200)
  })
})
