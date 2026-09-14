import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCall, mockFetch, ok } from '@/test/helpers'
import { getStock } from './stock'

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
  vi.mocked(cacheTag).mockClear()
  vi.mocked(cacheLife).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
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
