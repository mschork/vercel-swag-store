import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  valid: vi.fn(),
  listPhotos: vi.fn(),
  openPhoto: vi.fn(),
}))

vi.mock('@/lib/testimonials/photo-link', () => ({ photoSignatureValid: m.valid }))
vi.mock('@/lib/testimonials/blob', () => ({ listPhotos: m.listPhotos, openPhoto: m.openPhoto }))

const { GET } = await import('./route')
const call = (sig = 'abc') =>
  GET(new Request(`http://localhost/api/testimonials/photo/wrun_1?sig=${sig}`), {
    params: Promise.resolve({ runId: 'wrun_1' }),
  })

beforeEach(() => {
  m.valid.mockReturnValue(true)
  m.listPhotos.mockResolvedValue(['testimonials/wrun_1/1.jpg', 'testimonials/wrun_1/2.jpg'])
  m.openPhoto.mockResolvedValue(new Response('jpeg').body)
})

describe('GET /api/testimonials/photo/[runId]', () => {
  it("serves the run's latest photo, never cached", async () => {
    const response = await call()
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).toBe('jpeg')
    expect(m.valid).toHaveBeenCalledWith('wrun_1', 'abc')
    expect(m.openPhoto).toHaveBeenCalledWith('testimonials/wrun_1/2.jpg')
  })

  it('refuses a bad signature and answers 404 once the photo is gone', async () => {
    m.valid.mockReturnValue(false)
    expect((await call()).status).toBe(403)
    m.valid.mockReturnValue(true)
    m.listPhotos.mockResolvedValue([])
    expect((await call()).status).toBe(404)
  })
})
