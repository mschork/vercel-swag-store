import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CART_COOKIE,
  clearCartToken,
  getCartToken,
  setCartToken,
} from './cookie'

const { jar, cookieStore } = vi.hoisted(() => {
  const jar = new Map<string, string>()
  const cookieStore = {
    get: vi.fn((name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    ),
    set: vi.fn((name: string, value: string) => {
      jar.set(name, value)
    }),
    delete: vi.fn((cookie: { name: string }) => {
      jar.delete(cookie.name)
    }),
  }
  return { jar, cookieStore }
})

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

beforeEach(() => {
  jar.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cart cookie', () => {
  it('reads the token, treating a missing or empty cookie as none', async () => {
    await expect(getCartToken()).resolves.toBeUndefined()
    jar.set(CART_COOKIE, '')
    await expect(getCartToken()).resolves.toBeUndefined()
    jar.set(CART_COOKIE, 'abc')
    await expect(getCartToken()).resolves.toBe('abc')
  })

  it('sets an httpOnly, lax, site-wide cookie that lives one day', async () => {
    await setCartToken('abc')
    expect(cookieStore.set).toHaveBeenCalledWith('cart_token', 'abc', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 86400,
    })
  })

  it('marks the cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await setCartToken('abc')
    expect(cookieStore.set).toHaveBeenCalledWith(
      'cart_token',
      'abc',
      expect.objectContaining({ secure: true }),
    )
  })

  it('clears the cookie on the path it was set on', async () => {
    jar.set(CART_COOKIE, 'abc')
    await clearCartToken()
    expect(cookieStore.delete).toHaveBeenCalledWith({
      name: 'cart_token',
      path: '/',
    })
    await expect(getCartToken()).resolves.toBeUndefined()
  })
})
