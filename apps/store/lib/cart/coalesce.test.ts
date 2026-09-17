import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCoalescer } from './coalesce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createCoalescer', () => {
  it('sends nothing during the pause and only the last value after it', () => {
    const send = vi.fn()
    const quantity = createCoalescer(400, send)
    quantity.push(2)
    vi.advanceTimersByTime(300)
    quantity.push(3)
    vi.advanceTimersByTime(300)
    quantity.push(4)
    vi.advanceTimersByTime(399)
    expect(send).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(send.mock.calls).toEqual([[4]])
  })

  it('sends each value separated by a full pause', () => {
    const send = vi.fn()
    const quantity = createCoalescer(400, send)
    quantity.push(2)
    vi.advanceTimersByTime(400)
    quantity.push(3)
    vi.advanceTimersByTime(400)
    expect(send.mock.calls).toEqual([[2], [3]])
  })

  it('flush sends the waiting value at once and only once', () => {
    const send = vi.fn()
    const quantity = createCoalescer(400, send)
    quantity.push(5)
    quantity.flush()
    expect(send.mock.calls).toEqual([[5]])
    vi.advanceTimersByTime(1000)
    quantity.flush()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('flush with nothing waiting sends nothing', () => {
    const send = vi.fn()
    createCoalescer(400, send).flush()
    expect(send).not.toHaveBeenCalled()
  })

  it('cancel drops the waiting value', () => {
    const send = vi.fn()
    const quantity = createCoalescer(400, send)
    quantity.push(5)
    quantity.cancel()
    vi.advanceTimersByTime(1000)
    quantity.flush()
    expect(send).not.toHaveBeenCalled()
  })

  it('sends a falsy value such as 0', () => {
    const send = vi.fn()
    const quantity = createCoalescer(400, send)
    quantity.push(0)
    quantity.flush()
    expect(send.mock.calls).toEqual([[0]])
  })
})
