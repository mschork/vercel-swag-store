import { afterEach, describe, expect, it, vi } from 'vitest'
import { handler, postDecision, type SubmissionDecision } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const decision: SubmissionDecision = {
  _id: 'testimonialSubmission.wrun_1',
  runId: 'wrun_1',
  status: 'accepted',
  rejectionReason: null,
  photoAlt: 'A black mug',
}

describe('postDecision', () => {
  it('posts the projection to the store with the bearer secret', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(postDecision('https://store.example', 's3cret', decision)).resolves.toBe('resumed')
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(String(url)).toBe('https://store.example/api/testimonials/decision')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ authorization: 'Bearer s3cret' })
    expect(JSON.parse(init.body as string)).toEqual(decision)
  })

  it('answers that no run waits on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    await expect(postDecision('https://store.example', 's3cret', decision)).resolves.toBe('no run waits')
  })

  it('throws on a 500, without the secret in the message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })))
    const error = (await postDecision('https://store.example', 's3cret', decision).catch((e: unknown) => e)) as Error
    expect(error.message).toMatch(/answered 500/)
    expect(error.message).not.toMatch(/s3cret/)
  })

  it('throws when the function is not configured', async () => {
    await expect(postDecision(undefined, 's3cret', decision)).rejects.toThrow('STORE_URL')
  })
})

describe('handler', () => {
  it('calls nothing on a local test run', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await handler({ context: { local: true }, event: { data: decision } } as unknown as Parameters<typeof handler>[0])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
