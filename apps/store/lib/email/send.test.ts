import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({
  serverEnv: { EMAIL_DOMAIN: 'mail.example.com', RESEND_API_KEY: undefined as string | undefined },
}))
vi.mock('@/lib/env', () => env)

const { sendEmail } = await import('./send')

const content = { subject: 'Code', html: '<p>123456</p>', text: '123456' }

beforeEach(() => {
  env.serverEnv.RESEND_API_KEY = undefined
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('sendEmail without a key', () => {
  it('logs the message without the address and sends nothing', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await sendEmail('ada@example.com', content)
    const logged = log.mock.calls.flat().join(' ')
    expect(logged).toContain('123456')
    expect(logged).not.toContain('ada@example.com')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('sendEmail with a key', () => {
  beforeEach(() => {
    env.serverEnv.RESEND_API_KEY = 're_secret'
  })

  it('posts the message to Resend from the testimonials address', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 'email_1' }))
    vi.stubGlobal('fetch', fetchMock)
    await sendEmail('ada@example.com', content, { idempotencyKey: 'testimonial-outcome/wrun_1' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({
      authorization: 'Bearer re_secret',
      'idempotency-key': 'testimonial-outcome/wrun_1',
    })
    expect(JSON.parse(init.body as string)).toEqual({
      from: 'Vercel Swag Store <testimonials@mail.example.com>',
      to: ['ada@example.com'],
      subject: 'Code',
      html: '<p>123456</p>',
      text: '123456',
    })
  })

  it('sends no idempotency key unless one is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 'email_1' }))
    vi.stubGlobal('fetch', fetchMock)
    await sendEmail('ada@example.com', content)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).not.toHaveProperty('idempotency-key')
  })

  it('throws on a refusal with the error name, never the key, the address or the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ name: 'validation_error', message: 'Invalid `to`: ada@example.com' }, { status: 422 }),
      ),
    )
    const error = (await sendEmail('ada@example.com', content).catch((e: unknown) => e)) as Error
    expect(error.message).toBe('Resend answered 422 (validation_error)')
    expect(error.message).not.toMatch(/re_secret|ada@example\.com/)
  })
})
