import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readChangesInFlight,
  settleChange,
  startChange,
  subscribeChangesInFlight,
} from './changes-in-flight'

afterEach(() => {
  for (const productId of Object.keys(readChangesInFlight())) settleChange(productId)
})

describe('changes in flight', () => {
  it('holds the quantity a change is saving until it settles', () => {
    startChange('tshirt_001', 2)
    expect(readChangesInFlight()).toEqual({ tshirt_001: 2 })
    settleChange('tshirt_001', 2)
    expect(readChangesInFlight()).toEqual({})
  })

  it('holds a removal as a quantity of 0', () => {
    startChange('tshirt_001', 0)
    expect(readChangesInFlight()).toEqual({ tshirt_001: 0 })
  })

  it('keeps a newer change when an older one settles late', () => {
    startChange('tshirt_001', 2)
    startChange('tshirt_001', 1)
    settleChange('tshirt_001', 2)
    expect(readChangesInFlight()).toEqual({ tshirt_001: 1 })
  })

  it('tells subscribers of every change, and nobody when nothing changed', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeChangesInFlight(listener)
    startChange('tshirt_001', 2)
    startChange('tshirt_001', 2)
    settleChange('mug_001', 1)
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })
})
