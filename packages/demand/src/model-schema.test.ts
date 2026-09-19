import { describe, expect, it } from 'vitest'
import { ModelOutputSchema } from './model-schema.ts'

const parse = (cluster: object) => ModelOutputSchema.safeParse({ clusters: [cluster] }).success

describe('ModelOutputSchema', () => {
  it('requires a title for newProduct and a match for alreadySold', () => {
    expect(parse({ kind: 'newProduct', gapIds: ['g'], rationale: 'r' })).toBe(false)
    expect(parse({ kind: 'newProduct', gapIds: ['g'], rationale: 'r', title: 'Umbrella' })).toBe(true)
    expect(parse({ kind: 'alreadySold', gapIds: ['g'], rationale: 'r' })).toBe(false)
    expect(parse({ kind: 'alreadySold', gapIds: ['g'], rationale: 'r', match: 'hoodies' })).toBe(true)
    expect(parse({ kind: 'noise', gapIds: ['g'], rationale: 'r' })).toBe(true)
  })

  it('rejects an empty cluster, a long title and an unknown kind', () => {
    expect(parse({ kind: 'noise', gapIds: [], rationale: 'r' })).toBe(false)
    expect(parse({ kind: 'newProduct', gapIds: ['g'], rationale: 'r', title: 'x'.repeat(61) })).toBe(false)
    expect(parse({ kind: 'instruction', gapIds: ['g'], rationale: 'r' })).toBe(false)
  })
})
