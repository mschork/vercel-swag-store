import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCall, mockFetch, ok } from '@/test/helpers'
import { findCategory, getCategories } from './categories'

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
  vi.mocked(cacheTag).mockClear()
  vi.mocked(cacheLife).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

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

describe('findCategory', () => {
  it('finds a category by slug, or returns null', async () => {
    fetchMock.mockImplementation(async () =>
      ok([{ slug: 't-shirts', name: 'T Shirts', productCount: 6 }]),
    )
    await expect(findCategory('t-shirts')).resolves.toMatchObject({ name: 'T Shirts' })
    await expect(findCategory('umbrellas')).resolves.toBeNull()
  })
})
