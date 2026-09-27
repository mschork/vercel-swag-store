import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ serverEnv: { TESTIMONIAL_PHOTO_SECRET: 'x'.repeat(32) } }))

const { photoSignatureValid, photoUrl } = await import('./photo-link')

describe('photo links', () => {
  it('point at the photo route with a signature the route accepts', () => {
    const url = new URL(photoUrl('wrun_1'))
    expect(url.pathname).toBe('/api/testimonials/photo/wrun_1')
    expect(photoSignatureValid('wrun_1', url.searchParams.get('sig'))).toBe(true)
  })

  it('refuse another run, a missing or a malformed signature', () => {
    const sig = new URL(photoUrl('wrun_1')).searchParams.get('sig')
    expect(photoSignatureValid('wrun_2', sig)).toBe(false)
    expect(photoSignatureValid('wrun_1', null)).toBe(false)
    expect(photoSignatureValid('wrun_1', 'zz')).toBe(false)
  })
})
