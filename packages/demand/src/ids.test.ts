import { describe, expect, it } from 'vitest'
import { gapId, ideaId } from './ids.ts'

describe('ids', () => {
  it('gives a gap a stable, dotted, private id', () => {
    expect(gapId('umbrella')).toBe(gapId('umbrella'))
    expect(gapId('umbrella')).toMatch(/^searchGap\.[0-9a-f]{16}$/)
    expect(gapId('umbrella')).not.toBe(gapId('umbrellas'))
  })

  it('gives the same gaps the same idea id in any order', () => {
    const a = gapId('umbrella')
    const b = gapId('rain umbrella')
    expect(ideaId([a, b])).toBe(ideaId([b, a]))
    expect(ideaId([a, b])).toMatch(/^productIdea\.[0-9a-f]{16}$/)
    expect(ideaId([a])).not.toBe(ideaId([a, b]))
  })
})
