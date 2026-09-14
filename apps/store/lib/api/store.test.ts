import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFetch, ok } from '@/test/helpers'
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
