import { describe, expect, it } from 'vitest'
import { markdownPathFor } from './paths'

const PAGES = [
  ['/', '/index.md'],
  ['/products', '/products.md'],
  ['/products/category/bags', '/products/category/bags.md'],
  ['/products/black-crewneck-t-shirt', '/products/black-crewneck-t-shirt.md'],
  ['/testimonials', '/testimonials.md'],
  ['/testimonials/page/2', '/testimonials.md'],
] as const

describe('markdownPathFor', () => {
  it.each(PAGES)('points %s at %s', (page, markdown) => {
    expect(markdownPathFor(page)).toBe(markdown)
  })

  it.each(['/cart', '/search', '/no/such/page'])(
    'is null for %s, which has no Markdown version',
    (page) => {
      expect(markdownPathFor(page)).toBeNull()
    },
  )

})
