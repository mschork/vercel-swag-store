import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCall, mockFetch, ok } from '@/test/helpers'
import { getCategories } from './categories'

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
