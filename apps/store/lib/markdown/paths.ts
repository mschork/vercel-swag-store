import type { Metadata } from 'next'

/** The address of a page's Markdown version: the page's path plus `.md`. */
export function markdownPath(pagePath: string): string {
  return pagePath === '/' ? '/index.md' : `${pagePath}.md`
}

/**
 * `<link rel="alternate" type="text/markdown">` for a page's metadata, the
 * only pointer a page carries to its Markdown version. `metadataBase` makes
 * it absolute.
 */
export function markdownAlternate(pagePath: string): NonNullable<Metadata['alternates']> {
  return { types: { 'text/markdown': markdownPath(pagePath) } }
}
