import { describe, expect, it } from 'vitest'
import type { Cart } from '@/lib/api/types'
import { product } from '@/test/helpers'
import {
  applyDrafts,
  cartTotals,
  setDraft,
  linesWithWrites,
  toLines,
  type Line,
} from './lines'

const cart: Cart = {
  items: [
    {
      productId: 'tshirt_001',
      quantity: 2,
      addedAt: '2026-09-15T00:00:00Z',
      product: product(),
      lineTotal: 6000,
    },
    {
      productId: 'mug_001',
      quantity: 1,
      addedAt: '2026-09-15T00:01:00Z',
      product: product({
        id: 'mug_001',
        name: 'Mug',
        slug: 'mug',
        price: 1250,
        images: [],
      }),
      lineTotal: 1250,
    },
  ],
  totalItems: 3,
  subtotal: 7250,
  currency: 'USD',
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:01:00Z',
}

const lines: Line[] = toLines(cart)

describe('toLines', () => {
  it('keeps only what a row renders, in cart order', () => {
    expect(lines).toEqual([
      {
        productId: 'tshirt_001',
        slug: 'black-crewneck-t-shirt',
        name: 'Black Crewneck T-Shirt',
        image: 'https://example.com/tee.png',
        price: 3000,
        quantity: 2,
      },
      {
        productId: 'mug_001',
        slug: 'mug',
        name: 'Mug',
        image: null,
        price: 1250,
        quantity: 1,
      },
    ])
  })
})

describe('cartTotals', () => {
  it('matches the totals the API computes', () => {
    expect(cartTotals(lines)).toEqual({
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
    })
  })

  it('is zero for no lines', () => {
    expect(cartTotals([])).toEqual({ totalItems: 0, subtotal: 0 })
  })
})

describe('drafts', () => {
  const lines: Line[] = [
    { productId: 'a', slug: 'a', name: 'A', image: null, price: 100, quantity: 1 },
    { productId: 'b', slug: 'b', name: 'B', image: null, price: 250, quantity: 2 },
  ]

  it('shows a waiting quantity over the line and leaves others alone', () => {
    const shown = applyDrafts(lines, { a: 4 })
    expect(shown.map((line) => line.quantity)).toEqual([4, 2])
    expect(shown[1]).toBe(lines[1])
    expect(cartTotals(shown)).toEqual({ totalItems: 6, subtotal: 900 })
  })

  it('ignores a draft for a line that is gone', () => {
    expect(applyDrafts(lines.slice(1), { a: 4 })).toEqual(lines.slice(1))
  })

  it('sets and removes a draft', () => {
    const set = setDraft({}, 'a', 3)
    expect(set).toEqual({ a: 3 })
    expect(setDraft(set, 'a', 3)).toBe(set)
    expect(setDraft(set, 'a', null)).toEqual({})
    expect(setDraft({}, 'a', null)).toEqual({})
  })

  it('a late removal never wipes a newer draft', () => {
    expect(setDraft({ a: 5 }, 'a', null, 4)).toEqual({ a: 5 })
    expect(setDraft({ a: 4 }, 'a', null, 4)).toEqual({})
  })
})

describe('linesWithWrites', () => {
  const tee: Line = { productId: 'tee', slug: 'tee', name: 'Tee', image: null, price: 3000, quantity: 1 }
  const toteDisplay = { slug: 'tote', name: 'Tote', image: null, price: 2000 }

  it('adds a pending line, and the answer replaces it in one step', () => {
    const add = { kind: 'add', productId: 'tote', quantity: 2, display: toteDisplay } as const
    const saving = linesWithWrites([tee], [add], {})
    expect(saving.map(({ productId, quantity, pending }) => [productId, quantity, pending])).toEqual([
      ['tee', 1, false],
      ['tote', 2, true],
    ])
    expect(cartTotals(saving).totalItems).toBe(3)

    const answered = linesWithWrites([tee, { ...tee, ...toteDisplay, productId: 'tote', quantity: 2 }], [], {})
    expect(cartTotals(answered).totalItems).toBe(3)
    expect(answered.some((line) => line.pending)).toBe(false)
  })

  it('raises a saved line by an add of the same product', () => {
    const add = { kind: 'add', productId: 'tee', quantity: 2, display: tee } as const
    expect(linesWithWrites([tee], [add], {})).toMatchObject([{ productId: 'tee', quantity: 3, pending: true }])
  })

  it('applies writes in the order they were sent, then drafts', () => {
    const lines = linesWithWrites(
      [tee],
      [
        { kind: 'set', productId: 'tee', quantity: 4 },
        { kind: 'add', productId: 'tote', quantity: 1, display: toteDisplay },
      ],
      { tote: 5 },
    )
    expect(lines).toMatchObject([
      { productId: 'tee', quantity: 4, changing: true },
      { productId: 'tote', quantity: 5, pending: true },
    ])
  })

  it('drops a line a removal is saving', () => {
    expect(linesWithWrites([tee], [{ kind: 'set', productId: 'tee', quantity: 0 }], {})).toEqual([])
  })
})
