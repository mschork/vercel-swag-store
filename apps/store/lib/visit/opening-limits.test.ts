import { describe, expect, it } from 'vitest'
import { OPENING_DRAW_DEADLINE_MS, OPENING_DRAW_WAIT_MS } from './opening-limits'

describe('opening draw limits', () => {
  it('lets the server give up before the browser does', () => {
    expect(OPENING_DRAW_DEADLINE_MS).toBeLessThan(OPENING_DRAW_WAIT_MS)
  })
})
