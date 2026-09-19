import { describe, expect, it } from 'vitest'
import { normaliseGap } from './normalise.ts'

describe('normaliseGap', () => {
  it('lowercases, strips punctuation and collapses whitespace', () => {
    expect(normaliseGap('  Rain   UMBRELLA!!  ')).toBe('rain umbrella')
    expect(normaliseGap('t-shirt (black)')).toBe('t-shirt black')
  })

  it('folds unicode with NFKC and keeps letters of any script', () => {
    expect(normaliseGap('ｕｍｂｒｅｌｌａ')).toBe('umbrella')
    expect(normaliseGap('Café mug')).toBe('café mug')
  })

  it('cuts to 64 characters', () => {
    expect(normaliseGap('a'.repeat(80))).toHaveLength(64)
  })

  it.each([
    ['an email address', 'jane@example.com'],
    ['anything with an @', 'hoodie @ home'],
    ['a URL', 'https://vercel.com/swag'],
    ['a www address', 'www.vercel'],
    ['a bare domain', 'buy at vercel.com'],
    ['a digit run', 'order 12345678'],
    ['a spaced phone number', '0171 234 5678'],
    ['two characters', 'ab'],
    ['punctuation only', '?!?!'],
    ['seven words', 'one two three four five six seven'],
    ['an empty string', ''],
  ])('drops %s', (_label, raw) => {
    expect(normaliseGap(raw)).toBeNull()
  })

  it('keeps six words and short digit runs', () => {
    expect(normaliseGap('one two three four five six')).toBe('one two three four five six')
    expect(normaliseGap('16 inch laptop sleeve')).toBe('16 inch laptop sleeve')
  })
})
