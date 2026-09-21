import { describe, expect, it } from 'vitest'
import { sameOriginPath } from './safe-redirect'

describe('sameOriginPath', () => {
  it('keeps a path, its query and its hash', () => {
    expect(sameOriginPath('/products/hoodie?x=1#care')).toBe('/products/hoodie?x=1#care')
    expect(sameOriginPath('/')).toBe('/')
  })

  it('keeps a double slash in the query', () => {
    expect(sameOriginPath('/search?ref=https://a.example//b')).toBe(
      '/search?ref=https://a.example//b',
    )
  })

  it.each(['/.//evil.example', '/..//evil.example/x', '/a/..//evil.example'])(
    'never returns a path that leaves the origin: %s',
    (target) => {
      const origin = 'https://store.example'
      expect(new URL(sameOriginPath(target), origin).origin).toBe(origin)
    },
  )

  it.each([
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example/path'],
    ['a backslash spelling', '/\\evil.example'],
    ['a dot segment that hides a double slash', '/.//evil.example'],
    ['a parent segment that hides a double slash', '/..//evil.example/x'],
    ['a double slash after a collapsed segment', '/a/..//evil.example'],
    ['a tab inside the double slash', '/\t/evil.example'],
    ['a newline inside the double slash', '/\n/evil.example'],
    ['a tab that parsing turns into a double slash', '/./\t/evil.example'],
    ['a double slash deeper in the path', '/products//hoodie'],
    ['a scheme without slashes', 'javascript:alert(1)'],
    ['a relative path', 'products/hoodie'],
    ['nothing', null],
    ['an empty string', ''],
  ])('sends %s to the home page', (_, target) => {
    expect(sameOriginPath(target)).toBe('/')
  })
})
