import { describe, expect, it } from 'vitest'
import { loadGeist } from './og-font'

describe('loadGeist', () => {
  it('reads the font once per process', async () => {
    const first = loadGeist()
    expect(loadGeist()).toBe(first)
    expect((await first).byteLength).toBeGreaterThan(0)
  })
})
