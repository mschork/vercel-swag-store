import { describe, expect, it } from 'vitest'
import type { Cart } from '@/lib/api/types'
import { product } from '@/test/helpers'
import { applyLineChange, cartTotals, toLines, type Line } from './lines'

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

describe('applyLineChange', () => {
  it('sets the quantity of one line', () => {
    const next = applyLineChange(lines, { productId: 'mug_001', quantity: 4 })
    expect(next.map((line) => line.quantity)).toEqual([2, 4])
    expect(lines[1]?.quantity).toBe(1)
  })

  it('removes the line at quantity 0', () => {
    const next = applyLineChange(lines, { productId: 'tshirt_001', quantity: 0 })
    expect(next.map((line) => line.productId)).toEqual(['mug_001'])
  })

  it('leaves the lines alone for a product not in the cart', () => {
    expect(
      applyLineChange(lines, { productId: 'nope', quantity: 3 }),
    ).toEqual(lines)
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
