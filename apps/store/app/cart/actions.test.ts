import { afterEach, describe, expect, it, vi } from 'vitest'
import { addToCart } from './actions'

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addToCart (E05 stub)', () => {
  it('accepts a product id and a whole quantity of at least 1', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '2' })),
    ).resolves.toEqual({ ok: true })
    expect(info).toHaveBeenCalledWith(expect.any(String), {
      productId: 'tshirt_001',
      quantity: 2,
    })
  })

  it.each(['0', '-1', '1.5', 'abc', ''])(
    'rejects quantity %j',
    async (quantity) => {
      await expect(
        addToCart(null, form({ productId: 'tshirt_001', quantity })),
      ).resolves.toEqual({
        ok: false,
        error: 'Choose a whole quantity of at least 1.',
      })
    },
  )

  it('rejects a missing product id', async () => {
    await expect(addToCart(null, form({ quantity: '1' }))).resolves.toEqual({
      ok: false,
      error: 'This item could not be added.',
    })
  })
})
