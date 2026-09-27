import { describe, expect, it } from 'vitest'
import { suggestReason } from './reason.ts'

describe('suggestReason', () => {
  it('points at the photo when its quality is low', () => {
    expect(suggestReason({ qualityScore: 0.3, productSource: 'visitor' })).toBe('photo')
  })

  it('points at the product when the visitor picked it', () => {
    expect(suggestReason({ qualityScore: 0.9, productSource: 'visitor' })).toBe('product')
  })

  it('suggests nothing when the findings are clean', () => {
    expect(suggestReason({ qualityScore: 0.9, productSource: 'agent' })).toBeNull()
  })

  it('suggests nothing without findings', () => {
    expect(suggestReason(null)).toBeNull()
    expect(suggestReason({})).toBeNull()
  })
})
