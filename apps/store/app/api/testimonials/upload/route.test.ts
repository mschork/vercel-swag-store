import { MAX_PHOTO_ATTEMPTS } from '@repo/testimonials/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  admit: vi.fn(),
  ownChat: vi.fn(),
  runLive: vi.fn(),
  countUpload: vi.fn(),
  handleUploadPresigned: vi.fn(),
  signUpload: vi.fn(async () => 'token'),
}))

vi.mock('@/lib/testimonials/guard', () => ({
  admit: m.admit,
  ownChat: m.ownChat,
  runLive: m.runLive,
  refuse: (status: number, error: string) => Response.json({ error }, { status }),
}))
vi.mock('@/lib/session/store', () => ({ sessionStore: { countUpload: m.countUpload } }))
vi.mock('@vercel/blob/client', () => ({ handleUploadPresigned: m.handleUploadPresigned }))
vi.mock('@/lib/testimonials/blob', () => ({ signUpload: m.signUpload }))

const { POST } = await import('./route')
const call = (body: unknown) =>
  POST(new Request('http://localhost/api/testimonials/upload', { method: 'POST', body: JSON.stringify(body) }))
const issue = (pathname: string) => ({
  type: 'blob.generate-presigned-url',
  payload: { pathname, clientPayload: null, multipart: false },
})

beforeEach(() => {
  for (const mock of Object.values(m)) mock.mockClear()
  m.admit.mockResolvedValue({ sid: 'sid-1' })
  m.ownChat.mockResolvedValue({ sid: 'sid-1', messages: [], turnStart: 0 })
  m.runLive.mockResolvedValue(true)
  m.countUpload.mockResolvedValue(1)
  m.handleUploadPresigned.mockImplementation(async ({ getSignedToken, body }) => {
    await getSignedToken(body.payload.pathname)
    return { type: 'blob.generate-presigned-url', presignedUrlPayload: {} }
  })
})

describe('reserving a pathname', () => {
  it('refuses a reservation without a run', async () => {
    expect((await call({ type: 'reserve', runId: null })).status).toBe(400)
    expect(m.countUpload).not.toHaveBeenCalled()
  })

  it('counts the attempts of a named run and refuses past the limit', async () => {
    m.countUpload.mockResolvedValue(2)
    await expect((await call({ type: 'reserve', runId: 'wrun_1' })).json()).resolves.toEqual({
      pathname: 'testimonials/wrun_1/2.jpg',
    })
    m.countUpload.mockResolvedValue(MAX_PHOTO_ATTEMPTS + 1)
    expect((await call({ type: 'reserve', runId: 'wrun_1' })).status).toBe(409)
  })

  it("refuses another session's run and one that has ended", async () => {
    m.ownChat.mockResolvedValueOnce(Response.json({}, { status: 404 }))
    expect((await call({ type: 'reserve', runId: 'wrun_1' })).status).toBe(404)
    m.runLive.mockResolvedValueOnce(false)
    expect((await call({ type: 'reserve', runId: 'wrun_1' })).status).toBe(410)
  })

  it('answers 503 when the session store fails', async () => {
    m.countUpload.mockResolvedValue(null)
    expect((await call({ type: 'reserve', runId: 'wrun_1' })).status).toBe(503)
  })
})

describe('signing an upload', () => {
  it('signs a pathname of a live run of this session', async () => {
    const response = await call(issue('testimonials/wrun_1/1.jpg'))
    expect(response.status).toBe(200)
    expect(m.ownChat).toHaveBeenCalledWith('wrun_1', 'sid-1')
    expect(m.signUpload).toHaveBeenCalledWith('testimonials/wrun_1/1.jpg')
  })

  it('refuses any other pathname, a callback and a malformed body', async () => {
    expect((await call(issue('photo.jpg'))).status).toBe(400)
    expect((await call({ type: 'blob.upload-completed', payload: {} })).status).toBe(400)
    expect((await call(null)).status).toBe(400)
    expect(m.signUpload).not.toHaveBeenCalled()
  })

  it('refuses an ended run', async () => {
    m.runLive.mockResolvedValue(false)
    expect((await call(issue('testimonials/wrun_1/1.jpg'))).status).toBe(410)
  })
})

it('answers what admit refuses', async () => {
  m.admit.mockResolvedValue(Response.json({}, { status: 429 }))
  expect((await call({ type: 'reserve', runId: 'wrun_1' })).status).toBe(429)
})
