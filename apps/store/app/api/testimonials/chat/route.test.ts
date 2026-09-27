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
}))

vi.mock('@/lib/testimonials/guard', () => ({
  admit: m.admit,
  ownChat: m.ownChat,
  runLive: m.runLive,
  refuse: (status: number, error: string) => Response.json({ error }, { status }),
}))
vi.mock('workflow/api', () => ({ start: m.start }))
vi.mock('@/workflows/testimonial', () => ({ testimonial: 'testimonial' }))
vi.mock('@/lib/session/store', () => ({
  sessionStore: { currentChat: m.currentChat, openChat: m.openChat, saveChat: m.saveChat },
}))
vi.mock('@/lib/testimonials/stream', () => ({ turnResponse: m.turnResponse }))

const { GET, POST } = await import('./route')
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

  it('refuses anything but a typed first message', async () => {
    expect((await post({ messages, photo: 'testimonials/wrun_1/1.jpg' })).status).toBe(400)
    expect((await post({})).status).toBe(400)
    expect(m.start).not.toHaveBeenCalled()
  })

  it('cancels the run when the session store fails', async () => {
    m.openChat.mockResolvedValue(false)
    expect((await post({ messages })).status).toBe(503)
    expect(m.cancel).toHaveBeenCalled()
  })
})
