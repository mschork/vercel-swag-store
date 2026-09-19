/**
 * A redirect target taken from a query string: only a path on this origin.
 * An absolute URL, a protocol-relative `//host`, and the backslash spellings
 * browsers read the same way all fall back to the home page.
 */
export function sameOriginPath(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    return '/'
  }
  try {
    const base = 'http://store.invalid'
    const url = new URL(target, base)
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : '/'
  } catch {
    return '/'
  }
}
