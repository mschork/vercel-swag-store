import { describe, expect, it } from 'vitest'
import { typingFragments } from './fragments.ts'

const gap = (query: string, count: number) => ({ _id: query, query, count })

describe('typingFragments', () => {
  it('folds "umb" and "umbre" into "umbrella"', () => {
    const fragments = typingFragments([gap('umb', 2), gap('umbre', 1), gap('umbrella', 5)])
    expect([...fragments]).toEqual([
      ['umb', 'umbrella'],
      ['umbre', 'umbrella'],
    ])
  })

  it('does not fold "hood" into "hoodie" when "hood" was searched more', () => {
    expect(typingFragments([gap('hood', 4), gap('hoodie', 2)]).size).toBe(0)
  })

  it('needs more letters, not a new word', () => {
    expect(typingFragments([gap('rain', 1), gap('rain umbrella', 3)]).size).toBe(0)
  })
})
