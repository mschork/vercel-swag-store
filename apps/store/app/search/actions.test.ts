import { beforeEach, describe, expect, it, vi } from 'vitest'
import { product } from '@/test/helpers'

const m = vi.hoisted(() => ({
  callbacks: [] as (() => Promise<void>)[],
  recording: { client: {}, gap: 'umbrella' } as object | null,
  gapRecorder: vi.fn(),
  recordSearchGap: vi.fn(async () => {}),
  getAllProducts: vi.fn(),
}))

vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => void m.callbacks.push(callback),
}))
vi.mock('@/lib/search/record-gap', () => ({
  gapRecorder: m.gapRecorder,
  recordSearchGap: m.recordSearchGap,
}))
vi.mock('@/lib/api/products', () => ({
  getAllProducts: m.getAllProducts,
  getFeaturedProducts: async () => [],
}))
vi.mock('@/lib/api/categories', () => ({ getCategories: async () => [] }))

const { reportSearchGap } = await import('./actions')

const runAfter = async () => {
  for (const callback of m.callbacks) await callback()
}

beforeEach(() => {
  m.callbacks.length = 0
  m.recording = { client: {}, gap: 'umbrella' }
  m.gapRecorder.mockImplementation(async () => m.recording)
  m.recordSearchGap.mockClear()
  m.getAllProducts.mockReset()
  m.getAllProducts.mockResolvedValue([product({ id: 'mug', name: 'Mug' })])
})

describe('reportSearchGap', () => {
  it('returns before the catalogue reads settle', async () => {
    m.getAllProducts.mockReturnValue(new Promise(() => {}))
    await expect(reportSearchGap('umbrella')).resolves.toBeUndefined()
    expect(m.gapRecorder).toHaveBeenCalledExactlyOnceWith('umbrella')
    expect(m.callbacks).toHaveLength(1)
    expect(m.recordSearchGap).not.toHaveBeenCalled()
  })

  it('records a query the catalogue finds nothing for, after the response', async () => {
    await reportSearchGap('umbrella')
    expect(m.recordSearchGap).not.toHaveBeenCalled()
    await runAfter()
    expect(m.recordSearchGap).toHaveBeenCalledExactlyOnceWith(m.recording)
  })

  it('records nothing for a query that finds a product', async () => {
    await reportSearchGap('mug')
    await runAfter()
    expect(m.recordSearchGap).not.toHaveBeenCalled()
  })

  it('schedules nothing when the request may not count a gap', async () => {
    m.recording = null
    await reportSearchGap('umbrella')
    expect(m.callbacks).toHaveLength(0)
  })

  it('schedules nothing for input that is not a query', async () => {
    await reportSearchGap(42)
    await reportSearchGap('   ')
    expect(m.gapRecorder).not.toHaveBeenCalled()
  })

  it('records nothing when the catalogue cannot be read', async () => {
    m.getAllProducts.mockRejectedValue(new Error('down'))
    await reportSearchGap('umbrella')
    await expect(runAfter()).resolves.toBeUndefined()
    expect(m.recordSearchGap).not.toHaveBeenCalled()
  })
})
