/**
 * Open Graph fields every page shares. Next replaces a parent's `openGraph`
 * object wholesale when a page sets its own, so a page that sets an Open Graph
 * title or description spreads these in to keep the site name and locale.
 */
export function openGraphDefaults(siteName: string) {
  return { type: 'website', siteName, locale: 'en_US' } as const
}
