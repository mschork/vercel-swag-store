import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiError, mockFetch, ok } from '@/test/helpers'
import { getPromotion } from './promotions'

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
  vi.mocked(cacheTag).mockClear()
  vi.mocked(cacheLife).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
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

describe('getPromotion', () => {
  it('returns the active promotion, cached as catalogue data', async () => {
    fetchMock.mockResolvedValueOnce(ok(promotion))
    expect(await getPromotion()).toMatchObject({ code: 'SHIPIT20' })
    expect(cacheTag).toHaveBeenCalledWith('promotion')
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })

  it('returns null when the API sends no promotion', async () => {
    fetchMock.mockResolvedValueOnce(ok(null))
    expect(await getPromotion()).toBeNull()
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })

  it('returns null when the promotion is not active', async () => {
    fetchMock.mockResolvedValueOnce(ok({ ...promotion, active: false }))
    expect(await getPromotion()).toBeNull()
  })

  it('returns null for a 404, cached as catalogue data', async () => {
    fetchMock.mockResolvedValueOnce(apiError(404, 'NOT_FOUND', 'No active promotion'))
    expect(await getPromotion()).toBeNull()
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })

  it('returns null for a failed read, cached for minutes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValueOnce(apiError(400, 'VALIDATION_ERROR', 'Bad request'))
    expect(await getPromotion()).toBeNull()
    expect(cacheLife).toHaveBeenCalledWith('minutes')
    expect(cacheLife).not.toHaveBeenCalledWith('catalog')
  })
})
