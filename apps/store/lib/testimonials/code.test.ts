import { describe, expect, it } from 'vitest'
import { codeMatches, generateCode, hashCode } from './code'

describe('verification codes', () => {
  it('are six digits', () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^\d{6}$/)
  })

  it('match only their own hash in their own run', () => {
    const hash = hashCode('run1', '123456')
    expect(codeMatches('run1', '123456', hash)).toBe(true)
    expect(codeMatches('run1', '123457', hash)).toBe(false)
    expect(codeMatches('run2', '123456', hash)).toBe(false)
    expect(codeMatches('run1', '123456', 'abcd')).toBe(false)
  })
})
