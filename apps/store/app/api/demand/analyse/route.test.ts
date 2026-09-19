import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 'd'.repeat(64)
const start = vi.hoisted(() => vi.fn())

vi.mock('workflow/api', () => ({ start }))
vi.mock('@/workflows/analyse-demand', () => ({ analyseDemand: 'analyseDemand' }))

async function load(secret: string | undefined) {
  vi.resetModules()
  if (secret === undefined) delete process.env.DEMAND_ANALYSE_SECRET
  else process.env.DEMAND_ANALYSE_SECRET = secret
  return import('./route')
}

const call = (route: Awaited<ReturnType<typeof load>>, authorization?: string, body?: string) =>
  route.POST(
    new Request('http://localhost/api/demand/analyse', {
      method: 'POST',
      headers: authorization ? { authorization } : {},
      body,
    }),
  )

beforeEach(() => {
  start.mockReset().mockResolvedValue({ runId: 'wrun_1' })
})
afterEach(() => {
  delete process.env.DEMAND_ANALYSE_SECRET
})

describe('POST /api/demand/analyse', () => {
  it('starts the workflow and answers 202 with the right secret', async () => {
    const response = await call(await load(SECRET), `Bearer ${SECRET}`)
    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ runId: 'wrun_1' })
    expect(start).toHaveBeenCalledExactlyOnceWith('analyseDemand', [{ settle: true }])
  })

  it('passes settle: false through', async () => {
    await call(await load(SECRET), `Bearer ${SECRET}`, JSON.stringify({ settle: false }))
    expect(start).toHaveBeenCalledExactlyOnceWith('analyseDemand', [{ settle: false }])
  })

  it('answers 400 for a body of the wrong shape', async () => {
    const response = await call(await load(SECRET), `Bearer ${SECRET}`, JSON.stringify({ settle: 'no' }))
    expect(response.status).toBe(400)
    expect(start).not.toHaveBeenCalled()
  })

  it.each([
    ['no header', undefined],
    ['a wrong secret', `Bearer ${'e'.repeat(64)}`],
  ])('answers 401 with %s', async (_label, authorization) => {
    const response = await call(await load(SECRET), authorization)
    expect(response.status).toBe(401)
    expect(start).not.toHaveBeenCalled()
  })

  it('answers 401 for everyone when no secret is configured', async () => {
    const response = await call(await load(undefined), `Bearer ${SECRET}`)
    expect(response.status).toBe(401)
    expect(start).not.toHaveBeenCalled()
  })
})
