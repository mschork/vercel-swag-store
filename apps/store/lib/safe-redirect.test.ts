import { describe, expect, it } from 'vitest'
import { sameOriginPath } from './safe-redirect'

describe('sameOriginPath', () => {
  it('keeps a path, its query and its hash', () => {
    expect(sameOriginPath('/products/hoodie?x=1#care')).toBe('/products/hoodie?x=1#care')
    expect(sameOriginPath('/')).toBe('/')
  })

  it.each([
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example/path'],
    ['a backslash spelling', '/\\evil.example'],
    ['a scheme without slashes', 'javascript:alert(1)'],
    ['a relative path', 'products/hoodie'],
    ['nothing', null],
    ['an empty string', ''],
  ])('sends %s to the home page', (_, target) => {
    expect(sameOriginPath(target)).toBe('/')
  })
})
