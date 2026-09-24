import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isSessionId, SESSION_MAX_AGE_SECONDS } from '@/lib/session/id'
import { config, proxy } from './proxy'

const request = (cookie?: string) =>
  new NextRequest('https://store.test/cart', cookie ? { headers: { cookie } } : undefined)

const VALID = '0a620e2c-5f63-4a4c-82d3-734ad454775e'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('proxy', () => {
  it('mints a session id when the request carries none', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const minted = proxy(request()).cookies.get('sid')
    expect(isSessionId(minted?.value)).toBe(true)
    expect(minted).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
  })

  it('replaces an id that is not a UUID and leaves a valid one alone', () => {
    expect(proxy(request('sid=not-a-uuid')).cookies.get('sid')?.value).not.toBe('not-a-uuid')
    expect(proxy(request(`sid=${VALID}`)).cookies.get('sid')).toBeUndefined()
  })

  it('mints nothing for a crawler or a link preview', () => {
    const bot = new NextRequest('https://store.test/', {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    })
    expect(proxy(bot).cookies.get('sid')).toBeUndefined()
    const preview = new NextRequest('https://store.test/', { headers: { 'user-agent': 'Slackbot-LinkExpanding 1.0' } })
    expect(proxy(preview).cookies.get('sid')).toBeUndefined()
  })

  it("skips requests whose cookie matches the id's own pattern", () => {
    const [matcher] = config.matcher
    const pattern = new RegExp(`^${matcher?.missing[0]?.value}$`)
    for (const value of [VALID, 'not-a-uuid', `${VALID}x`, VALID.toUpperCase(), '']) {
      expect(pattern.test(value)).toBe(isSessionId(value))
    }
  })
})
