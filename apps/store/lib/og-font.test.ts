import { describe, expect, it } from 'vitest'
import { loadOgFonts, OG_FONT_FAMILY } from './og-font'

describe('loadOgFonts', () => {
  it('registers Geist, read once per process', async () => {
    const [first] = await loadOgFonts()
    const [second] = await loadOgFonts()
    expect(first?.name).toBe(OG_FONT_FAMILY)
    expect(first?.data.byteLength).toBeGreaterThan(0)
    expect(second?.data).toBe(first?.data)
  })
})
