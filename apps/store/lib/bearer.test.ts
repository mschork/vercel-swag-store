import { describe, expect, it } from 'vitest'
import { authorised } from './bearer'

describe('authorised', () => {
  it('accepts only the exact bearer secret', () => {
    expect(authorised('Bearer secret', 'secret')).toBe(true)
    expect(authorised('Bearer secreT', 'secret')).toBe(false)
    expect(authorised('Bearer secret-and-more', 'secret')).toBe(false)
    expect(authorised('secret', 'secret')).toBe(false)
    expect(authorised(null, 'secret')).toBe(false)
  })

  it('authorises nobody when the secret is unset', () => {
    expect(authorised('Bearer ', undefined)).toBe(false)
    expect(authorised('Bearer undefined', undefined)).toBe(false)
  })
})
