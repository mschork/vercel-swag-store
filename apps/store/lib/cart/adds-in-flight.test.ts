import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Line } from './lines'

type Store = typeof import('./adds-in-flight')
let store: Store

// Each test gets a fresh module, because the store is module state.
beforeEach(async () => {
  vi.resetModules()
  store = await import('./adds-in-flight')
})

const bottle = { slug: 'bottle', name: 'Bottle', image: '/bottle.png', price: 2500 }
const pin = { slug: 'pin', name: 'Pin', image: null, price: 800 }

function line(productId: string, quantity: number): Line {
  const display = productId === 'bottle_001' ? bottle : pin
  return { productId, quantity, ...display }
}

describe('pending lines', () => {
  it('sums adds per product and in total, in the order first clicked', () => {
    store.startAdd('pin_001', 4, pin)
    store.startAdd('bottle_001', 1, bottle)
    store.startAdd('bottle_001', 2, bottle)

    expect(store.addsInFlight('bottle_001')).toBe(3)
    expect(store.totalInFlight()).toBe(7)
    expect(store.readAddsInFlight().pending).toEqual([
      { productId: 'pin_001', quantity: 4, ...pin },
      { productId: 'bottle_001', quantity: 3, ...bottle },
    ])
  })

  it('records no line for a quantity below 1', () => {
    store.startAdd('bottle_001', 0, bottle)
    expect(store.readAddsInFlight().pending).toEqual([])
  })

  it('releases an answered add, and drops the line at zero', () => {
    store.startAdd('bottle_001', 2, bottle)
    store.startAdd('bottle_001', 1, bottle)
    store.settleAdd('bottle_001', 2, { ok: true, lines: [line('bottle_001', 2)] })
    expect(store.addsInFlight('bottle_001')).toBe(1)

    store.settleAdd('bottle_001', 1, { ok: true, lines: [line('bottle_001', 3)] })
    expect(store.readAddsInFlight().pending).toEqual([])
    expect(store.totalInFlight()).toBe(0)
  })

  it('applies an answer as one change with one notification', () => {
    const listener = vi.fn()
    store.startAdd('bottle_001', 1, bottle)
    store.subscribeAddsInFlight(listener)
    const before = store.readAddsInFlight()

    store.settleAdd('bottle_001', 1, { ok: true, lines: [line('bottle_001', 1)] })

    const after = store.readAddsInFlight()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(after).not.toBe(before)
    expect(after.pending).toEqual([])
    expect(after.saved).toEqual({ version: 1, lines: [line('bottle_001', 1)] })
  })

  it('keeps the same snapshot until something changes', () => {
    const listener = vi.fn()
    store.subscribeAddsInFlight(listener)
    const first = store.readAddsInFlight()

    store.dismissFailures()
    store.noteNavigation(true)

    expect(store.readAddsInFlight()).toBe(first)
    expect(listener).not.toHaveBeenCalled()
  })

  it('tells subscribers until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = store.subscribeAddsInFlight(listener)
    store.startAdd('pin_001', 1, pin)
    unsubscribe()
    store.startAdd('pin_001', 1, pin)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('answers nothing pending on the server', () => {
    store.startAdd('pin_001', 1, pin)
    expect(store.serverAddsInFlight().pending).toEqual([])
  })
})

describe('saved answers', () => {
  it('numbers answers in the order they arrive', () => {
    store.publishLines([line('pin_001', 1)])
    store.startAdd('bottle_001', 1, bottle)
    store.settleAdd('bottle_001', 1, { ok: true, lines: [line('pin_001', 1), line('bottle_001', 1)] })

    expect(store.readAddsInFlight().saved?.version).toBe(2)
  })

  it('keeps the saved lines when an answer carries none', () => {
    store.publishLines([line('pin_001', 1)])
    store.startAdd('bottle_001', 1, bottle)
    store.settleAdd('bottle_001', 1, { ok: false, error: 'Try again.' })

    expect(store.readAddsInFlight().saved).toEqual({ version: 1, lines: [line('pin_001', 1)] })
  })

  it('takes the lines a failure carries', () => {
    store.startAdd('bottle_001', 5, bottle)
    store.settleAdd('bottle_001', 5, {
      ok: false,
      error: 'Only 3 available.',
      lines: [line('bottle_001', 3)],
    })

    expect(store.readAddsInFlight().saved?.lines).toEqual([line('bottle_001', 3)])
  })
})

describe('failed adds', () => {
  it('keeps a failure under the product name, one per product', () => {
    store.startAdd('bottle_001', 1, bottle)
    store.startAdd('bottle_001', 1, bottle)
    store.settleAdd('bottle_001', 1, { ok: false, error: 'First.' })
    store.settleAdd('bottle_001', 1, { ok: false, error: 'Second.' })

    expect(store.readAddsInFlight().failures).toEqual([
      { productId: 'bottle_001', name: 'Bottle', error: 'Second.' },
    ])
  })

  it('records no failure for an add that had nothing in flight', () => {
    store.settleAdd('bottle_001', 1, { ok: false, error: 'Gone.' })
    store.startAdd('pin_001', 0, pin)
    store.settleAdd('pin_001', 0, { ok: false, error: 'Choose a quantity.' })

    expect(store.readAddsInFlight().failures).toEqual([])
  })

  it('clears the failures on the next add and on dismissal', () => {
    store.startAdd('bottle_001', 1, bottle)
    store.settleAdd('bottle_001', 1, { ok: false, error: 'Try again.' })
    store.startAdd('pin_001', 1, pin)
    expect(store.readAddsInFlight().failures).toEqual([])

    store.settleAdd('pin_001', 1, { ok: false, error: 'Try again.' })
    store.dismissFailures()
    expect(store.readAddsInFlight().failures).toEqual([])
  })
})

describe('noteNavigation', () => {
  it('marks every answer so far as included in a fetched page', () => {
    store.publishLines([line('pin_001', 1)])
    store.noteNavigation(true)
    expect(store.readAddsInFlight().navigated).toBe(1)
  })

  it('marks none as included in a page restored by back or forward', () => {
    store.publishLines([line('pin_001', 1)])
    store.noteNavigation(true)
    store.noteNavigation(false)
    expect(store.readAddsInFlight().navigated).toBe(0)
  })
})

describe('holdLines', () => {
  const rendered = [line('pin_001', 1)]

  it('holds the rendered lines when no answer is newer than the navigation', () => {
    store.publishLines([line('pin_001', 2)])
    store.noteNavigation(true)
    const held = store.holdLines(null, rendered, store.readAddsInFlight())

    expect(held).toEqual({ rendered, lines: rendered, version: 1 })
  })

  it('takes an answer that arrived after the navigation over the rendered lines', () => {
    store.noteNavigation(true)
    const answered = [line('pin_001', 1), line('bottle_001', 1)]
    store.publishLines(answered)

    expect(store.holdLines(null, rendered, store.readAddsInFlight()).lines).toBe(answered)
  })

  it('answers the same object when nothing changed', () => {
    const held = store.holdLines(null, rendered, store.readAddsInFlight())
    expect(store.holdLines(held, rendered, store.readAddsInFlight())).toBe(held)
  })

  it('applies a newer answer to what it holds, once', () => {
    const held = store.holdLines(null, rendered, store.readAddsInFlight())
    const answered = [line('pin_001', 3)]
    store.publishLines(answered)
    const next = store.holdLines(held, rendered, store.readAddsInFlight())

    expect(next).toEqual({ rendered, lines: answered, version: 1 })
    expect(store.holdLines(next, rendered, store.readAddsInFlight())).toBe(next)
  })

  it('lets new rendered lines replace an answer the page already includes', () => {
    store.publishLines([line('pin_001', 3)])
    const held = store.holdLines(null, rendered, store.readAddsInFlight())
    store.noteNavigation(true)
    const fresh = [line('bottle_001', 1)]

    expect(store.holdLines(held, fresh, store.readAddsInFlight()).lines).toBe(fresh)
  })
})

describe('withPending', () => {
  it('raises a line already saved and marks it pending', () => {
    const [shown] = store.withPending([line('pin_001', 1)], [
      { productId: 'pin_001', quantity: 2, ...pin },
    ])
    expect(shown).toEqual({ ...line('pin_001', 3), pending: true })
  })

  it('adds a row at the end for a product not yet saved', () => {
    const shown = store.withPending([line('pin_001', 1)], [
      { productId: 'bottle_001', quantity: 1, ...bottle },
    ])
    expect(shown).toEqual([
      { ...line('pin_001', 1), pending: false },
      { ...line('bottle_001', 1), pending: true },
    ])
  })

  it('shows only pending rows when nothing is saved', () => {
    expect(store.withPending([], [{ productId: 'pin_001', quantity: 1, ...pin }])).toEqual([
      { ...line('pin_001', 1), pending: true },
    ])
  })
})
