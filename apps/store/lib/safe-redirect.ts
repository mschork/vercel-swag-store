/**
 * A redirect target taken from a query string: only a path on this origin.
 * An absolute URL, a path holding `//`, and the backslash spellings browsers
 * read the same way all fall back to the home page. The query may hold `//`.
 *
 * The check runs on the parsed path, because parsing can move a `//` to the
 * front, where it names a host: `/.//host` becomes `//host`.
 */
export function sameOriginPath(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.includes('\\')) return '/'
  try {
    const base = 'http://store.invalid'
    const url = new URL(target, base)
    if (url.origin !== base || url.pathname.includes('//')) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
