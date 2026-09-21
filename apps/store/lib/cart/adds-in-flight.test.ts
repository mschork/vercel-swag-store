import { afterEach, describe, expect, it, vi } from 'vitest'
import { addsInFlight, changeInFlight, subscribeInFlight, totalInFlight } from './adds-in-flight'

afterEach(() => {
  for (const id of ['bottle_001', 'pin_001']) changeInFlight(id, -addsInFlight(id))
})

describe('adds in flight', () => {
  it('sums queued adds per product and in total', () => {
    changeInFlight('bottle_001', 1)
    changeInFlight('bottle_001', 2)
    changeInFlight('pin_001', 4)

    expect(addsInFlight('bottle_001')).toBe(3)
    expect(totalInFlight()).toBe(7)
  })

  it('takes an answered add back off, and never goes below zero', () => {
    changeInFlight('bottle_001', 2)
    changeInFlight('bottle_001', -2)
    changeInFlight('bottle_001', -1)

    expect(addsInFlight('bottle_001')).toBe(0)
    expect(totalInFlight()).toBe(0)
  })

  it('tells subscribers until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeInFlight(listener)
    changeInFlight('pin_001', 1)
    unsubscribe()
    changeInFlight('pin_001', 1)

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
