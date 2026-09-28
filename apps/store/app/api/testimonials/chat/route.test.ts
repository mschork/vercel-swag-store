import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  admit: vi.fn(),
  ownChat: vi.fn(),
  runLive: vi.fn(),
  start: vi.fn(),
  cancel: vi.fn(async () => {}),
  currentChat: vi.fn(),
  openChat: vi.fn(),
  saveChat: vi.fn(),
  turnResponse: vi.fn(() => new Response('turn')),
  chatEnded: vi.fn(),
  endChat: vi.fn(),
  resume: vi.fn(),
}))
const errors = vi.hoisted(() => ({
  HookNotFoundError: class HookNotFoundError extends Error {
    static is(error: unknown) {
      return error instanceof Error && error.name === 'HookNotFoundError'
    }
    name = 'HookNotFoundError'
  },
}))

vi.mock('@/lib/testimonials/guard', () => ({
  admit: m.admit,
  ownChat: m.ownChat,
  runLive: m.runLive,
  refuse: (status: number, error: string) => Response.json({ error }, { status }),
}))
vi.mock('workflow/api', () => ({ start: m.start }))
vi.mock('workflow/errors', () => errors)
vi.mock('@/workflows/testimonial', () => ({ testimonial: 'testimonial', turnHook: { resume: m.resume } }))
vi.mock('@/lib/session/store', () => ({
  sessionStore: {
    currentChat: m.currentChat,
    openChat: m.openChat,
    saveChat: m.saveChat,
    chatEnded: m.chatEnded,
    endChat: m.endChat,
  },
}))
vi.mock('@/lib/testimonials/stream', () => ({ turnResponse: m.turnResponse }))

const { DELETE, GET, POST } = await import('./route')
const url = 'http://localhost/api/testimonials/chat'
const messages = [{ id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }]

beforeEach(() => {
  for (const mock of Object.values(m)) mock.mockClear()
  m.admit.mockResolvedValue({ sid: 'sid-1' })
  m.ownChat.mockResolvedValue({ sid: 'sid-1', messages, turnStart: 3 })
  m.runLive.mockResolvedValue(true)
  m.start.mockResolvedValue({ runId: 'wrun_new', cancel: m.cancel })
  m.currentChat.mockResolvedValue('wrun_1')
  m.openChat.mockResolvedValue(true)
  m.saveChat.mockResolvedValue(true)
  m.chatEnded.mockResolvedValue(false)
  m.endChat.mockResolvedValue(true)
  m.resume.mockResolvedValue({ runId: 'wrun_1' })
})

describe('GET /api/testimonials/chat', () => {
  it("answers the session's live conversation with its messages", async () => {
    await expect((await GET(new Request(url))).json()).resolves.toEqual({ runId: 'wrun_1', messages })
  })

  it('answers null without one, or when it has ended', async () => {
    m.runLive.mockResolvedValue(false)
    await expect((await GET(new Request(url))).json()).resolves.toBeNull()
    m.currentChat.mockResolvedValue(null)
    await expect((await GET(new Request(url))).json()).resolves.toBeNull()
  })

  it('answers null for a run bound to another session', async () => {
    m.ownChat.mockResolvedValue(Response.json({ error: 'Not found' }, { status: 404 }))
    await expect((await GET(new Request(url))).json()).resolves.toBeNull()
  })

  it('checks the run and reads its chat at the same time', async () => {
    let settle = () => {}
    m.runLive.mockReturnValue(new Promise<boolean>((resolve) => (settle = () => resolve(true))))
    const response = GET(new Request(url))
    await vi.waitFor(() => expect(m.ownChat).toHaveBeenCalledWith('wrun_1', 'sid-1'))
    settle()
    await expect((await response).json()).resolves.toEqual({ runId: 'wrun_1', messages })
  })
})

describe('POST /api/testimonials/chat', () => {
  const post = (body: unknown) => POST(new Request(url, { method: 'POST', body: JSON.stringify(body) }))

  it('starts a run with the first message and streams its first turn', async () => {
    expect(await (await post({ messages })).text()).toBe('turn')
    expect(m.start).toHaveBeenCalledWith('testimonial', [{ kind: 'message', text: 'Hello' }])
    expect(m.openChat).toHaveBeenCalledWith('sid-1', 'wrun_new')
    expect(m.saveChat).toHaveBeenCalledWith('wrun_new', { sid: 'sid-1', messages, turnStart: 0 })
    expect(m.turnResponse).toHaveBeenCalledWith('wrun_new', 0)
  })

  it('starts a run with the name entered in the greeting', async () => {
    await post({ messages, name: 'Ada' })
    expect(m.start).toHaveBeenCalledWith('testimonial', [{ kind: 'name', name: 'Ada' }])
  })

  it('refuses anything but a greeting name or a typed first message', async () => {
    expect((await post({ messages, name: ' ' })).status).toBe(400)
    expect((await post({})).status).toBe(400)
    expect(m.start).not.toHaveBeenCalled()
  })

  it('cancels the run when the session store fails', async () => {
    m.openChat.mockResolvedValue(false)
    expect((await post({ messages })).status).toBe(503)
    expect(m.cancel).toHaveBeenCalled()
  })
})

describe('DELETE /api/testimonials/chat', () => {
  const del = () => DELETE(new Request(url, { method: 'DELETE' }))

  it('marks the conversation ended, then tells the run to close', async () => {
    expect((await del()).status).toBe(204)
    expect(m.endChat).toHaveBeenCalledWith('wrun_1')
    expect(m.resume).toHaveBeenCalledWith('testimonial-turn:wrun_1', { kind: 'close' })
    expect(m.endChat.mock.invocationCallOrder[0]).toBeLessThan(m.resume.mock.invocationCallOrder[0]!)
  })

  it('does nothing for no conversation or one already ended', async () => {
    m.currentChat.mockResolvedValue(null)
    expect((await del()).status).toBe(204)
    m.currentChat.mockResolvedValue('wrun_1')
    m.chatEnded.mockResolvedValue(true)
    expect((await del()).status).toBe(204)
    expect(m.resume).not.toHaveBeenCalled()
  })

  it('answers 204 when the run takes no more turns, such as a submitted one', async () => {
    m.resume.mockRejectedValue(new errors.HookNotFoundError('gone'))
    expect((await del()).status).toBe(204)
  })

  it('answers 503 when the session store fails', async () => {
    m.currentChat.mockResolvedValue('unavailable')
    expect((await del()).status).toBe(503)
    m.currentChat.mockResolvedValue('wrun_1')
    m.endChat.mockResolvedValue(false)
    expect((await del()).status).toBe(503)
    expect(m.resume).not.toHaveBeenCalled()
  })
})
