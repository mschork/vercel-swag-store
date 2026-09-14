import { describe, expect, it } from 'vitest'
import { product, rawCart } from '@/test/helpers'
import { CartSchema, ProductSchema, RawCartSchema, withoutToken } from './schemas'

describe('schemas', () => {
  it('drops unknown API fields instead of failing', () => {
    const parsed = ProductSchema.parse(product({ newField: 'from a future API' }))
    expect(parsed).not.toHaveProperty('newField')
    expect(parsed.slug).toBe('black-crewneck-t-shirt')
  })

  it('CartSchema strips the token; RawCartSchema keeps it', () => {
    const raw = rawCart()
    expect(CartSchema.parse(raw)).not.toHaveProperty('token')
    expect(RawCartSchema.parse(raw).token).toBe('body-token')
    expect(withoutToken(RawCartSchema.parse(raw))).not.toHaveProperty('token')
  })

  it('rejects a non-integer price', () => {
    expect(() => ProductSchema.parse(product({ price: 29.99 }))).toThrow()
  })
})
