import { describe, expect, it } from 'vitest'
import { socialLinks } from './social-links'

describe('socialLinks', () => {
  it('maps known networks to their display names', () => {
    expect(
      socialLinks({ twitter: 'https://x.com/v', github: 'https://github.com/v', discord: 'https://discord.gg/v' }).map(
        (l) => l.label,
      ),
    ).toEqual(['X', 'GitHub', 'Discord'])
  })

  it('capitalises unknown keys instead of dropping them', () => {
    expect(socialLinks({ mastodon: 'https://m.social/v' })[0]?.label).toBe('Mastodon')
  })

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
