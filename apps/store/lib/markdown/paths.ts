import type { Metadata } from 'next'

/** The address of a page's Markdown version: the page's path plus `.md`. */
export function markdownPath(pagePath: string): string {
  return pagePath === '/' ? '/index.md' : `${pagePath}.md`
}

/**
 * The pages with a Markdown version, as the rewrites in `next.config.ts`
 * serve them.
 */
const MARKDOWN_PAGES = [
  /^\/$/,
  /^\/products$/,
  /^\/products\/category\/[^/]+$/,
  /^\/products\/[^/]+$/,
  /^\/testimonials$/,
]

/**
 * The Markdown version of the page at `pathname`, or `null` when it has none.
 * A page of the testimonial wall renders at `/testimonials/page/<n>` and
 * shows `/testimonials` in the browser; both get the whole wall's file.
 */
export function markdownPathFor(pathname: string): string | null {
  if (/^\/testimonials\/page\/\d+$/.test(pathname)) return markdownPath('/testimonials')
  return MARKDOWN_PAGES.some((page) => page.test(pathname)) ? markdownPath(pathname) : null
}

/**
 * `<link rel="alternate" type="text/markdown">` for a page's metadata.
 * `metadataBase` makes it absolute.
 */
export function markdownAlternate(pagePath: string): NonNullable<Metadata['alternates']> {
  return { types: { 'text/markdown': markdownPath(pagePath) } }
}
