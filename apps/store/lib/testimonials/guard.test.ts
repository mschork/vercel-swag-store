import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  offered: true,
  sid: 'sid-1' as string | null,
  isBot: false,
  rateLimited: false,
  chat: null as unknown,
  status: 'running' as string | Error,
}))

vi.mock('./chat', () => ({
  get chatOffered() {
    return state.offered
  },
}))
vi.mock('@/lib/session/cookie', () => ({ getSessionId: async () => state.sid }))
vi.mock('@/lib/session/store', () => ({ sessionStore: { readChat: async () => state.chat } }))
vi.mock('botid/server', () => ({ checkBotId: async () => ({ isBot: state.isBot }) }))
vi.mock('@vercel/firewall', () => ({ checkRateLimit: async () => ({ rateLimited: state.rateLimited }) }))
vi.mock('workflow/api', () => ({
  getRun: () => ({
    get status() {
      return state.status instanceof Error ? Promise.reject(state.status) : Promise.resolve(state.status)
    },
  }),
}))

const { admit, ownChat, runLive } = await import('./guard')
const request = new Request('https://store.test/api/testimonials/chat', { method: 'POST' })

beforeEach(() => {
  Object.assign(state, { offered: true, sid: 'sid-1', isBot: false, rateLimited: false, chat: null, status: 'running' })
})
afterEach(() => vi.unstubAllEnvs())

describe('admit', () => {
  it('answers the session id', async () => {
    expect(await admit(request)).toEqual({ sid: 'sid-1' })
  })

  it('answers 404 when the chat is not offered and 401 without a session', async () => {
    state.offered = false
    expect(((await admit(request)) as Response).status).toBe(404)
    state.offered = true
    state.sid = null
    expect(((await admit(request)) as Response).status).toBe(401)
  })

  it('refuses a bot and a rate-limited caller on Vercel only', async () => {
    state.isBot = true
    expect(await admit(request)).toEqual({ sid: 'sid-1' })
    vi.stubEnv('VERCEL', '1')
    expect(((await admit(request)) as Response).status).toBe(403)
    state.isBot = false
    state.rateLimited = true
    expect(((await admit(request)) as Response).status).toBe(429)
    expect(await admit(request, { rateLimit: false })).toEqual({ sid: 'sid-1' })
  })
})

describe('ownChat', () => {
  it("answers the chat of the caller's session and 404 for anyone else's", async () => {
    state.chat = { sid: 'sid-1', messages: [], turnStart: 3 }
    expect(await ownChat('wrun_1', 'sid-1')).toEqual(state.chat)
    expect(((await ownChat('wrun_1', 'sid-2')) as Response).status).toBe(404)
    state.chat = null
    expect(((await ownChat('wrun_1', 'sid-1')) as Response).status).toBe(404)
    state.chat = 'unavailable'
    expect(((await ownChat('wrun_1', 'sid-1')) as Response).status).toBe(503)
  })
})

describe('runLive', () => {
  it('is true only while the run is pending or running', async () => {
    expect(await runLive('wrun_1')).toBe(true)
    state.status = 'completed'
    expect(await runLive('wrun_1')).toBe(false)
    state.status = new Error('not found')
    expect(await runLive('wrun_1')).toBe(false)
  })
})
