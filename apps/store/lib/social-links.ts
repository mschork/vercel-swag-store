import type { StoreConfig } from './api/types'

/**
 * Labels for the networks `/store/config` is known to return. Any other key
 * is rendered too, capitalised, so the footer shows whatever the API sends.
 */
const KNOWN_LABELS: Record<string, string> = {
  twitter: 'X',
  github: 'GitHub',
  discord: 'Discord',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

export type SocialLink = { key: string; label: string; href: string }

export function socialLabel(key: string): string {
  return KNOWN_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

/** Ordered as the API returns them; entries with an empty URL are dropped. */
export function socialLinks(links: StoreConfig['socialLinks']): SocialLink[] {
  return Object.entries(links)
    .filter(([, href]) => href.length > 0)
    .map(([key, href]) => ({ key, label: socialLabel(key), href }))
}
