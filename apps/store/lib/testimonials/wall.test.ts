import { describe, expect, it } from 'vitest'
import { parseWallPage, showMorePath, wallEnd, wallPageCount, wallPath } from './wall'

describe('wallPageCount', () => {
  it('has one page for an empty wall', () => {
    expect(wallPageCount(0, 24)).toBe(1)
  })

  it('rounds a partial page up', () => {
    expect(wallPageCount(24, 24)).toBe(1)
    expect(wallPageCount(25, 24)).toBe(2)
  })
})

describe('parseWallPage', () => {
  it('accepts a page that exists', () => {
    expect(parseWallPage('1', 3)).toBe(1)
    expect(parseWallPage('3', 3)).toBe(3)
  })

  it('refuses a page past the end, zero, a leading zero and anything else', () => {
    for (const segment of ['4', '0', '02', '-1', '1.5', 'two', '']) {
      expect(parseWallPage(segment, 3)).toBeNull()
    }
  })
})

describe('wallEnd', () => {
  it('shows every page up to this one', () => {
    expect(wallEnd(1, 24)).toBe(24)
    expect(wallEnd(3, 24)).toBe(72)
  })
})

describe('wallPath', () => {
  it('is the page itself for page 1 and a query for the rest', () => {
    expect(wallPath(1)).toBe('/testimonials')
    expect(wallPath(2)).toBe('/testimonials?page=2')
  })
})

describe('showMorePath', () => {
  it('leads to the next page’s first new entry', () => {
    expect(showMorePath(1)).toBe('/testimonials?page=2#page-2')
  })
})
