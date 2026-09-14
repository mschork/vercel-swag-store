import { describe, expect, it } from 'vitest'
import { socialLabel, socialLinks } from './social-links'

describe('socialLabel', () => {
  it('maps known networks to their display names', () => {
    expect(socialLabel('twitter')).toBe('X')
    expect(socialLabel('github')).toBe('GitHub')
    expect(socialLabel('discord')).toBe('Discord')
  })

  it('capitalises unknown keys instead of dropping them', () => {
    expect(socialLabel('mastodon')).toBe('Mastodon')
  })
})

describe('socialLinks', () => {
  it('keeps API order and renders every key', () => {
    expect(
      socialLinks({ github: 'https://github.com/vercel', twitter: 'https://twitter.com/vercel', bluesky: 'https://bsky.app/v' }),
    ).toEqual([
      { key: 'github', label: 'GitHub', href: 'https://github.com/vercel' },
      { key: 'twitter', label: 'X', href: 'https://twitter.com/vercel' },
      { key: 'bluesky', label: 'Bluesky', href: 'https://bsky.app/v' },
    ])
  })

  it('drops entries with an empty URL', () => {
    expect(socialLinks({ twitter: '' })).toEqual([])
  })
})
