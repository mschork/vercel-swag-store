import { describe, expect, it } from 'vitest'
import { truncate } from './text'

describe('truncate', () => {
  it('returns text that fits unchanged', () => {
    expect(truncate('Plain black tee.', 160)).toBe('Plain black tee.')
  })

  it('cuts at a word boundary, within the limit, with an ellipsis', () => {
    const result = truncate('Insulated matte black stainless steel bottle', 20)
    expect(result).toBe('Insulated matte…')
    expect(result.length).toBeLessThanOrEqual(20)
  })

  it('drops punctuation left before the ellipsis', () => {
    expect(truncate('Minimal, durable, and travel-ready.', 18)).toBe(
      'Minimal, durable…',
    )
  })

  it('hard-cuts a single long word', () => {
    expect(truncate('Supercalifragilistic', 10)).toBe('Supercali…')
  })

  it('collapses whitespace before measuring', () => {
    expect(truncate('  black\n\n tee  ', 160)).toBe('black tee')
  })
})
