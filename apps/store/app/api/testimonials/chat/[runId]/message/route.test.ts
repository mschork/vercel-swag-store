import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  admit: vi.fn(),
  ownChat: vi.fn(),
  runLive: vi.fn(),
  saveChat: vi.fn(),
  resume: vi.fn(),
  nextIndex: vi.fn(async () => 14),
  turnResponse: vi.fn(() => new Response('turn')),
}))

class HookNotFoundError extends Error {
  static is(value: unknown): value is HookNotFoundError {
    return value instanceof HookNotFoundError
  }
}

vi.mock('@/lib/testimonials/guard', () => ({
  admit: m.admit,
  ownChat: m.ownChat,
  runLive: m.runLive,
  refuse: (status: number, error: string) => Response.json({ error }, { status }),
}))
vi.mock('@/lib/session/store', () => ({ sessionStore: { saveChat: m.saveChat } }))
vi.mock('@/lib/testimonials/stream', () => ({ nextIndex: m.nextIndex, turnResponse: m.turnResponse }))
vi.mock('@/workflows/testimonial', () => ({ turnHook: { resume: m.resume } }))
vi.mock('workflow/errors', () => ({ HookNotFoundError }))

const { POST } = await import('./route')
const messages = [{ id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }]
const call = (body: unknown) =>
  POST(new Request('http://localhost/api/testimonials/chat/wrun_1/message', { method: 'POST', body: JSON.stringify(body) }), {
    params: Promise.resolve({ runId: 'wrun_1' }),
  })

beforeEach(() => {
  vi.useRealTimers()
  for (const mock of Object.values(m)) mock.mockClear()
  m.admit.mockResolvedValue({ sid: 'sid-1' })
  m.ownChat.mockResolvedValue({ sid: 'sid-1', messages: [], turnStart: 0 })
  m.runLive.mockResolvedValue(true)
  m.saveChat.mockResolvedValue(true)
  m.resume.mockResolvedValue({})
})

describe('POST /api/testimonials/chat/[runId]/message', () => {
  it('saves the turn start before it resumes the hook, then streams that turn', async () => {
    const response = await call({ messages })
    expect(await response.text()).toBe('turn')
    expect(m.saveChat).toHaveBeenCalledWith('wrun_1', { sid: 'sid-1', messages, turnStart: 14 })
    expect(m.saveChat).toHaveBeenCalledBefore(m.resume)
    expect(m.resume).toHaveBeenCalledWith('testimonial-turn:wrun_1', { kind: 'message', text: 'Hello' })
    expect(m.turnResponse).toHaveBeenCalledWith('wrun_1', 14)
  })

  it('refuses a body that says nothing', async () => {
    expect((await call({ messages: [] })).status).toBe(400)
    expect((await call({ messages: [{ id: 'a', role: 'assistant', parts: [] }] })).status).toBe(400)
    expect(m.resume).not.toHaveBeenCalled()
  })

  it("refuses another session's run", async () => {
    m.ownChat.mockResolvedValue(Response.json({}, { status: 404 }))
    expect((await call({ messages })).status).toBe(404)
  })

  it('answers 410 once the run has ended', async () => {
    m.resume.mockRejectedValue(new HookNotFoundError())
    m.runLive.mockResolvedValue(false)
    expect((await call({ messages })).status).toBe(410)
  })

  it('retries while a new run has not created its hook yet', async () => {
    vi.useFakeTimers()
    m.resume.mockRejectedValueOnce(new HookNotFoundError()).mockResolvedValueOnce({})
    const pending = call({ messages })
    await vi.runAllTimersAsync()
    expect((await pending).status).toBe(200)
    expect(m.resume).toHaveBeenCalledTimes(2)
  })

  it('answers 503 when the session store fails', async () => {
    m.saveChat.mockResolvedValue(false)
    expect((await call({ messages })).status).toBe(503)
    expect(m.resume).not.toHaveBeenCalled()
  })
})
