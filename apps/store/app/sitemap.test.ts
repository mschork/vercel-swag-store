import { describe, expect, it, vi } from 'vitest'
import { getAllProducts } from '@/lib/api/products'
import type { Product } from '@/lib/api/types'
import { publicEnv } from '@/lib/env.public'
import { product } from '@/test/helpers'
import sitemap from './sitemap'

vi.mock('@/lib/api/products', () => ({ getAllProducts: vi.fn() }))

const site = (path: string) => new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).href

describe('sitemap', () => {
  it('lists home, search and every product with its creation date', async () => {
    vi.mocked(getAllProducts).mockResolvedValueOnce([
      product({ slug: 'one', createdAt: '2026-02-10T16:00:00Z' }),
      product({ slug: 'two', createdAt: '2026-03-01T09:00:00Z' }),
    ] as Product[])
    await expect(sitemap()).resolves.toEqual([
      { url: site('/') },
      { url: site('/search') },
      { url: site('/products/one'), lastModified: '2026-02-10T16:00:00Z' },
      { url: site('/products/two'), lastModified: '2026-03-01T09:00:00Z' },
    ])
  })
})
