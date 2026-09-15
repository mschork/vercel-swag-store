/**
 * Shortens `text` to at most `max` characters for meta descriptions: whitespace
 * is collapsed, the cut falls on the last word boundary, trailing punctuation
 * is dropped and an ellipsis marks the cut. Text that fits is returned as is.
 */
export function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  // The cut already ends a word when the next character is a space.
  const lastSpace = clean[max - 1] === ' ' ? cut.length : cut.lastIndexOf(' ')
  const head = lastSpace > 0 ? cut.slice(0, lastSpace) : cut
  return `${head.replace(/[\s.,;:!?-]+$/, '')}…`
}
