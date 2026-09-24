import { describe, expect, it } from 'vitest'
import { parseCart, parseVisit } from './records'

describe('parseVisit', () => {
  it('is none for an empty hash or one without its first draw time', () => {
    expect(parseVisit([])).toBeNull()
    expect(parseVisit(null)).toBeNull()
    expect(parseVisit(['stock:a', '3'])).toBeNull()
  })

  it('keeps the draws that parse and drops the rest', () => {
    expect(
      parseVisit(['drawnAt', '100', 'stock:a', '3', 'stock:b', '-1', 'stock:c', 'x', 'other', '1']),
    ).toEqual({ drawnAt: 100, stock: { a: 3 } })
  })

  it('reads a pinned promotion, a pinned null, and leaves an unreadable one unpinned', () => {
    expect(parseVisit(['drawnAt', '1', 'promotion', 'null'])).toEqual({
      drawnAt: 1,
      stock: {},
      promotion: null,
    })
    expect(parseVisit(['drawnAt', '1', 'promotion', '{not json'])).toEqual({ drawnAt: 1, stock: {} })
    expect(parseVisit(['drawnAt', '1', 'promotion', '{"id":1}'])).toEqual({ drawnAt: 1, stock: {} })
  })
})

describe('parseCart', () => {
  it('is none for anything that is not a stored cart', () => {
    expect(parseCart(null)).toBeNull()
    expect(parseCart('{not json')).toBeNull()
    expect(parseCart(JSON.stringify({ token: '', lines: [] }))).toBeNull()
  })
})
