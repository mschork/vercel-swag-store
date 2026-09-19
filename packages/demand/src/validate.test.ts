import { describe, expect, it } from 'vitest'
import { validateClusters } from './validate.ts'

const context = {
  gapIds: ['g1', 'g2', 'g3', 'g4'],
  products: [{ name: 'Black Hoodie', slug: 'black-hoodie' }],
  categories: [{ slug: 'hoodies' }, { slug: 'accessories' }],
}

describe('validateClusters', () => {
  it('drops gap ids that were not claimed and clusters left empty', () => {
    const { clusters, unmentioned } = validateClusters(
      {
        clusters: [
          { kind: 'newProduct', gapIds: ['g1', 'other'], title: 'Umbrella', rationale: 'r' },
          { kind: 'noise', gapIds: ['nope'], rationale: 'r' },
        ],
      },
      context,
    )
    expect(clusters).toEqual([{ kind: 'newProduct', gapIds: ['g1'], title: 'Umbrella', rationale: 'r' }])
    expect(unmentioned).toEqual(['g2', 'g3', 'g4'])
  })

  it('drops an idea named like an existing product, freeing its gaps', () => {
    const { clusters, unmentioned } = validateClusters(
      { clusters: [{ kind: 'newProduct', gapIds: ['g1'], title: ' black hoodie ', rationale: 'r' }] },
      context,
    )
    expect(clusters).toEqual([])
    expect(unmentioned).toContain('g1')
  })

  it('clears a category that does not exist and keeps one that does', () => {
    const { clusters } = validateClusters(
      {
        clusters: [
          { kind: 'newProduct', gapIds: ['g1'], title: 'Umbrella', rationale: 'r', suggestedCategory: 'weather' },
          { kind: 'newProduct', gapIds: ['g2'], title: 'Scarf', rationale: 'r', suggestedCategory: 'accessories' },
        ],
      },
      context,
    )
    expect(clusters[0]).not.toHaveProperty('suggestedCategory')
    expect(clusters[1]?.suggestedCategory).toBe('accessories')
  })

  it("keeps a gap's first appearance only", () => {
    const { clusters } = validateClusters(
      {
        clusters: [
          { kind: 'noise', gapIds: ['g1'], rationale: 'r' },
          { kind: 'newProduct', gapIds: ['g1', 'g2'], title: 'Umbrella', rationale: 'r' },
        ],
      },
      context,
    )
    expect(clusters.map((c) => c.gapIds)).toEqual([['g1'], ['g2']])
  })

  it('turns alreadySold without a real match into noise', () => {
    const { clusters } = validateClusters(
      {
        clusters: [
          { kind: 'alreadySold', gapIds: ['g1'], rationale: 'typo', match: 'hoodies' },
          { kind: 'alreadySold', gapIds: ['g2'], rationale: 'typo', match: 'black-hoodie' },
          { kind: 'alreadySold', gapIds: ['g3'], rationale: 'typo', match: 'jumpers' },
        ],
      },
      context,
    )
    expect(clusters.map((c) => [c.kind, c.match])).toEqual([
      ['alreadySold', 'hoodies'],
      ['alreadySold', 'black-hoodie'],
      ['noise', undefined],
    ])
  })
})
