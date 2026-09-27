import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 'd'.repeat(64)
const m = vi.hoisted(() => {
  class HookNotFoundError extends Error {
    static is(error: unknown) {
      return error instanceof HookNotFoundError
    }
  }
  return { resumeHook: vi.fn(), HookNotFoundError }
})

vi.mock('workflow/api', () => ({ resumeHook: m.resumeHook }))
vi.mock('workflow/errors', () => ({ HookNotFoundError: m.HookNotFoundError }))

async function load(secret: string | undefined) {
  vi.resetModules()
  if (secret === undefined) delete process.env.TESTIMONIAL_DECISION_SECRET
  else process.env.TESTIMONIAL_DECISION_SECRET = secret
  return import('./route')
}

const call = (route: Awaited<ReturnType<typeof load>>, authorization: string | undefined, body: unknown) =>
  route.POST(
    new Request('http://localhost/api/testimonials/decision', {
      method: 'POST',
      headers: authorization ? { authorization } : {},
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

const accepted = {
  _id: 'testimonialSubmission.wrun_1',
  runId: 'wrun_1',
  status: 'accepted',
  rejectionReason: null,
  photoAlt: 'A black mug on a desk',
}

beforeEach(() => {
  m.resumeHook.mockReset().mockResolvedValue({ runId: 'wrun_1' })
})
afterEach(() => {
  delete process.env.TESTIMONIAL_DECISION_SECRET
})

describe('POST /api/testimonials/decision', () => {
  it("resumes the run's review hook with what the run acts on", async () => {
    const response = await call(await load(SECRET), `Bearer ${SECRET}`, accepted)
    expect(response.status).toBe(202)
    expect(m.resumeHook).toHaveBeenCalledExactlyOnceWith('testimonial-review:wrun_1', {
      status: 'accepted',
      photoAlt: 'A black mug on a desk',
    })
  })

  it('passes a rejection with its reason', async () => {
    const rejected = { ...accepted, status: 'rejected', rejectionReason: 'product', photoAlt: 'A mug' }
    await call(await load(SECRET), `Bearer ${SECRET}`, rejected)
    expect(m.resumeHook).toHaveBeenCalledWith('testimonial-review:wrun_1', { status: 'rejected', rejectionReason: 'product' })
  })

  it('answers 401 to a wrong or missing secret, and to every call when the secret is unset', async () => {
    const route = await load(SECRET)
    expect((await call(route, 'Bearer wrong', accepted)).status).toBe(401)
    expect((await call(route, undefined, accepted)).status).toBe(401)
    expect((await call(await load(undefined), `Bearer ${SECRET}`, accepted)).status).toBe(401)
    expect(m.resumeHook).not.toHaveBeenCalled()
  })

  it('answers 400 to a body that is not a decision', async () => {
    const route = await load(SECRET)
    expect((await call(route, `Bearer ${SECRET}`, 'not json')).status).toBe(400)
    expect((await call(route, `Bearer ${SECRET}`, { ...accepted, status: 'pending' })).status).toBe(400)
    expect((await call(route, `Bearer ${SECRET}`, { ...accepted, runId: 'wrun_2' })).status).toBe(400)
    expect(m.resumeHook).not.toHaveBeenCalled()
  })

  it('answers 404 when no run waits for the decision', async () => {
    m.resumeHook.mockRejectedValue(new m.HookNotFoundError('gone'))
    expect((await call(await load(SECRET), `Bearer ${SECRET}`, accepted)).status).toBe(404)
  })

  it('lets any other failure surface', async () => {
    m.resumeHook.mockRejectedValue(new Error('backend down'))
    await expect(call(await load(SECRET), `Bearer ${SECRET}`, accepted)).rejects.toThrow('backend down')
  })
})
