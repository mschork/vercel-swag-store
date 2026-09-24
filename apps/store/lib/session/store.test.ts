import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/lib/api/types'
import { createMemory } from './memory'
import { RedisError, type Redis } from './redis'
import { CART_TTL_SECONDS, createSessionStore, VISIT_TTL_SECONDS } from './store'

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
  }),
}))

let clock = 1_800_000_000_000
const store = createSessionStore(createMemory(() => clock), () => clock)
let sid = ''
let counter = 0

const promotion = (id: string): Promotion => ({
  id,
  title: 'Summer',
  description: 'Save 10% automatically',
  discountPercent: 10,
  code: 'SUMMER',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  active: true,
})

const line = {
  productId: 'mug_001',
  slug: 'mug',
  name: 'Mug',
  image: null,
  price: 1200,
  quantity: 2,
}

const failing: Redis = {
  run: async () => {
    throw new RedisError('Upstash did not answer: TimeoutError')
  },
}

beforeEach(() => {
  clock += 10 * VISIT_TTL_SECONDS * 1000
  counter += 1
  sid = `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the visit', () => {
  it('reads as none until a draw is claimed', async () => {
    expect(await store.read(sid)).toEqual({ visit: null, cart: null })
  })

  it('keeps the first draw of each product and answers the winners', async () => {
    expect(await store.claimStock(sid, { a: 3, b: 0 })).toEqual({ a: 3, b: 0 })
    expect(await store.claimStock(sid, { a: 9, c: 5 })).toEqual({ a: 3, c: 5 })
    const state = await store.read(sid)
    expect(state).not.toBe('unavailable')
    if (state === 'unavailable') return
    expect(state.visit).toEqual({ stock: { a: 3, b: 0, c: 5 }, drawnAt: Math.floor(clock / 1000) })
  })

  it('pins the first promotion, null included', async () => {
    expect(await store.claimPromotion(sid, promotion('one'))).toEqual(promotion('one'))
    expect(await store.claimPromotion(sid, promotion('two'))).toEqual(promotion('one'))
    const other = `${sid.slice(0, -1)}f`
    expect(await store.claimPromotion(other, null)).toBeNull()
    expect(await store.claimPromotion(other, promotion('two'))).toBeNull()
  })

  it('lasts one day from the first draw, however often it is written', async () => {
    await store.claimStock(sid, { a: 3 })
    clock += (VISIT_TTL_SECONDS - 10) * 1000
    await store.claimStock(sid, { b: 4 })
    await store.setStock(sid, { a: 1 })
    clock += 10 * 1000
    expect(await store.read(sid)).toEqual({ visit: null, cart: null })
  })

  it('overwrites draws after an order and forgets the visit on reset', async () => {
    await store.claimStock(sid, { a: 3, b: 4 })
    expect(await store.setStock(sid, { a: 1 })).toBe(true)
    expect(await store.claimStock(sid, { a: 9 })).toEqual({ a: 1 })
    expect(await store.clearVisit(sid)).toBe(true)
    expect(await store.claimStock(sid, { a: 9 })).toEqual({ a: 9 })
  })
})

describe('the cart mirror', () => {
  it('holds the latest answer with its token, and renews its day on every write', async () => {
    expect(await store.setCart(sid, { token: 't', currency: 'USD', lines: [line], totalItems: 2 })).toBe(true)
    clock += (CART_TTL_SECONDS - 10) * 1000
    await store.setCart(sid, { token: 't', currency: 'USD', lines: [], totalItems: 0 })
    clock += 20 * 1000
    const state = await store.read(sid)
    expect(state).toEqual({
      visit: null,
      cart: { token: 't', currency: 'USD', lines: [], totalItems: 0, savedAt: clock - 20 * 1000 },
    })
    await store.clearCart(sid)
    expect(await store.read(sid)).toEqual({ visit: null, cart: null })
  })
})

describe('claimCart', () => {
  it('keeps the first cart opened and answers it to every later claim', async () => {
    const first = { token: 'first', currency: 'USD', lines: [], totalItems: 0 }
    expect(await store.claimCart(sid, first)).toMatchObject({ token: 'first' })
    expect(await store.claimCart(sid, { ...first, token: 'second' })).toMatchObject({ token: 'first' })
    await store.clearCart(sid)
    expect(await store.claimCart(sid, { ...first, token: 'third' })).toMatchObject({ token: 'third' })
  })
})

describe('when Redis fails', () => {
  const broken = createSessionStore(failing, () => clock)

  it('reads as unavailable, shows the draws it was given and reports writes as lost', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await broken.read(sid)).toBe('unavailable')
    expect(await broken.claimStock(sid, { a: 3 })).toEqual({ a: 3 })
    expect(await broken.claimPromotion(sid, promotion('one'))).toEqual(promotion('one'))
    expect(await broken.setCart(sid, { token: 'secret-token', currency: 'USD', lines: [], totalItems: 0 })).toBe(false)
    expect(await broken.setStock(sid, { a: 1 })).toBe(false)
    expect(await broken.clearVisit(sid)).toBe(false)
    expect(await broken.clearCart(sid)).toBe(false)
    expect(await broken.claimCart(sid, { token: 't', currency: 'USD', lines: [], totalItems: 0 })).toBeNull()
    expect(log).toHaveBeenCalledWith('[session] read failed: Upstash did not answer: TimeoutError')
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret-token')
  })
})

describe('getSession', () => {
  it('is unavailable without a valid session id, and reads the store with one', async () => {
    vi.resetModules()
    const { getSession, sessionStore } = await import('./store')
    jar.clear()
    expect(await getSession()).toBe('unavailable')
    jar.set('sid', 'not-a-uuid')
    expect(await getSession()).toBe('unavailable')
    jar.set('sid', sid)
    await sessionStore.claimStock(sid, { a: 3 })
    expect(await getSession()).toMatchObject({ sid, visit: { stock: { a: 3 } }, cart: null })
  })
})
