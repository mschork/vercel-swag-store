import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: { id: 'client' } as object | null,
  isBot: false,
  callbacks: [] as (() => Promise<void>)[],
  recordGap: vi.fn(),
}))

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => void mocks.callbacks.push(callback),
  userAgent: () => ({ isBot: mocks.isBot }),
}))
vi.mock('@/lib/sanity/write-client', () => ({ getWriteClient: () => mocks.client }))
vi.mock('@repo/demand', async (original) => ({
  ...(await original<typeof import('@repo/demand')>()),
  recordGap: mocks.recordGap,
}))

const { recordGapAfterResponse } = await import('./record-gap')

const runAfter = async () => {
  for (const callback of mocks.callbacks) await callback()
}

describe('recordGapAfterResponse', () => {
  beforeEach(() => {
    mocks.client = { id: 'client' }
    mocks.isBot = false
    mocks.callbacks.length = 0
    mocks.recordGap.mockReset()
  })

  it('records the normalised query after the response', async () => {
    await recordGapAfterResponse('  Rain UMBRELLA! ')
    expect(mocks.recordGap).not.toHaveBeenCalled()
    await runAfter()
    expect(mocks.recordGap).toHaveBeenCalledExactlyOnceWith(mocks.client, 'rain umbrella')
  })

  it('records nothing for a bot', async () => {
    mocks.isBot = true
    await recordGapAfterResponse('umbrella')
    expect(mocks.callbacks).toHaveLength(0)
  })

  it('records nothing without a write token', async () => {
    mocks.client = null
    await recordGapAfterResponse('umbrella')
    expect(mocks.callbacks).toHaveLength(0)
  })

  it('records nothing for a query the privacy filters drop', async () => {
    await recordGapAfterResponse('jane@example.com')
    await recordGapAfterResponse('ab')
    expect(mocks.callbacks).toHaveLength(0)
  })

  it('never throws when the write fails, and logs a code without the query', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.recordGap.mockRejectedValue(Object.assign(new Error('umbrella denied'), { statusCode: 403 }))
    await recordGapAfterResponse('umbrella')
    await expect(runAfter()).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledExactlyOnceWith('[search-gap]', 'status 403')
    log.mockRestore()
  })
})
