import { describe, expect, it, vi } from 'vitest'
import { CATEGORY_INTROS, queueCategoryIntros } from './category-intros.ts'

describe('queueCategoryIntros', () => {
  it('uses setIfMissing, so an editor’s intro is never replaced', () => {
    const transaction = { patch: vi.fn() }
    const queued = queueCategoryIntros(transaction, ['hats'])
    expect(queued).toBe(1)
    expect(transaction.patch).toHaveBeenCalledWith('category-hats', {
      setIfMissing: { intro: CATEGORY_INTROS.hats },
    })
  })

  it('skips a category it has no copy for', () => {
    const transaction = { patch: vi.fn() }
    expect(queueCategoryIntros(transaction, ['umbrellas'])).toBe(0)
    expect(transaction.patch).not.toHaveBeenCalled()
  })

  it('keeps every intro within the schema’s 200 characters', () => {
    for (const intro of Object.values(CATEGORY_INTROS)) expect(intro.length).toBeLessThanOrEqual(200)
  })
})
