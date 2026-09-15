import { describe, expect, it } from 'vitest'
import { openGraphDefaults } from './metadata'

describe('openGraphDefaults', () => {
  it('carries the site name, type and locale', () => {
    expect(openGraphDefaults('Vercel Swag Store')).toEqual({
      type: 'website',
      siteName: 'Vercel Swag Store',
      locale: 'en_US',
    })
  })
})
