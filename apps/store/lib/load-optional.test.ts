import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadOptional } from './load-optional'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadOptional', () => {
  it('returns the loaded value', async () => {
    await expect(loadOptional('Thing', async () => 42)).resolves.toBe(42)
  })

  it('returns null and logs once when loading fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('down')
    await expect(
      loadOptional('Thing', async () => Promise.reject(failure)),
    ).resolves.toBeNull()
    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith(
      'Thing unavailable, rendering without it',
      failure,
    )
  })
})
