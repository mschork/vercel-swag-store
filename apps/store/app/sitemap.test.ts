import { describe, expect, it, vi } from 'vitest'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts } from '@/lib/api/products'
import type { Product } from '@/lib/api/types'
import { publicEnv } from '@/lib/env.public'
import { product } from '@/test/helpers'
import sitemap from './sitemap'

vi.mock('@/lib/api/products', () => ({ getAllProducts: vi.fn() }))
vi.mock('@/lib/api/categories', () => ({ getCategories: vi.fn() }))

const site = (path: string) => new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).href

describe('sitemap', () => {
  it('lists home, search, the listing pages and every product with its creation date', async () => {
    vi.mocked(getAllProducts).mockResolvedValueOnce([
      product({ slug: 'one', createdAt: '2026-02-10T16:00:00Z' }),
      product({ slug: 'two', createdAt: '2026-03-01T09:00:00Z' }),
    ] as Product[])
    vi.mocked(getCategories).mockResolvedValueOnce([
      { slug: 'hats', name: 'Hats', productCount: 3 },
    ])
    await expect(sitemap()).resolves.toEqual([
      { url: site('/') },
      { url: site('/search') },
      { url: site('/products') },
      { url: site('/products/category/hats') },
      { url: site('/products/one'), lastModified: '2026-02-10T16:00:00Z' },
      { url: site('/products/two'), lastModified: '2026-03-01T09:00:00Z' },
    ])
  })
})
