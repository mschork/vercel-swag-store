import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCall, mockFetch, ok } from '@/test/helpers'
import { getCategories } from './categories'
import { getPromotion } from './promotions'
import { getStock } from './stock'
import { getHealth, getStoreConfig } from './store'

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
  vi.mocked(cacheTag).mockClear()
  vi.mocked(cacheLife).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const promotion = {
  id: 'promo_001',
  title: 'Summer',
  description: '20% off',
  discountPercent: 20,
  code: 'SHIPIT20',
  validFrom: '2025-06-01T00:00:00Z',
  validUntil: '2025-09-01T00:00:00Z',
  active: true,
}

describe('getCategories', () => {
  it('returns the list and declares the categories tag', async () => {
    fetchMock.mockResolvedValueOnce(ok([{ slug: 't-shirts', name: 'T Shirts', productCount: 6 }]))
    const categories = await getCategories()
    expect(categories[0]?.slug).toBe('t-shirts')
    expect(fetchCall(fetchMock)[0]).toMatch(/\/categories$/)
    expect(cacheTag).toHaveBeenCalledWith('categories')
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })
})

describe('getStoreConfig', () => {
  it('returns the config and declares the store tag', async () => {
    fetchMock.mockResolvedValueOnce(
      ok({
        storeName: 'Vercel Swag Store',
        currency: 'USD',
        features: { wishlist: true },
        socialLinks: { github: 'https://github.com/vercel' },
        seo: { defaultTitle: 'Vercel Swag Store', titleTemplate: '%s | Vercel Swag Store', defaultDescription: 'Swag.' },
      }),
    )
    const config = await getStoreConfig()
    expect(config.socialLinks.github).toBe('https://github.com/vercel')
    expect(cacheTag).toHaveBeenCalledWith('store')
  })
})

describe('getHealth', () => {
  it('is not cached', async () => {
    fetchMock.mockResolvedValueOnce(
      ok({ status: 'ok', timestamp: '2026-09-14T00:00:00Z', services: { redis: 'connected' } }),
    )
    const health = await getHealth()
    expect(health.status).toBe('ok')
    expect(cacheTag).not.toHaveBeenCalled()
    expect(cacheLife).not.toHaveBeenCalled()
  })
})

describe('getStock', () => {
  it('fetches live stock for a product and is not cached', async () => {
    fetchMock.mockResolvedValueOnce(ok({ productId: 'tshirt_001', stock: 3, inStock: true, lowStock: true }))
    const stock = await getStock('tshirt_001')
    expect(stock.lowStock).toBe(true)
    expect(fetchCall(fetchMock)[0]).toMatch(/\/products\/tshirt_001\/stock$/)
    expect(cacheTag).not.toHaveBeenCalled()
  })
})

describe('getPromotion', () => {
  it('returns the active promotion', async () => {
    fetchMock.mockResolvedValueOnce(ok(promotion))
    expect(await getPromotion()).toMatchObject({ code: 'SHIPIT20' })
    expect(cacheTag).not.toHaveBeenCalled()
  })

  it('returns null when the API sends no promotion', async () => {
    fetchMock.mockResolvedValueOnce(ok(null))
    expect(await getPromotion()).toBeNull()
  })

  it('returns null when the promotion is not active', async () => {
    fetchMock.mockResolvedValueOnce(ok({ ...promotion, active: false }))
    expect(await getPromotion()).toBeNull()
  })
})
