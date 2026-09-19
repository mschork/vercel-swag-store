import { MAX_QUERY_LENGTH, MAX_QUERY_WORDS, MIN_QUERY_LENGTH } from './constants.ts'

const URL_OR_DOMAIN = /(?:https?:\/\/|www\.)|[\p{L}\p{N}-]+\.\p{L}{2,}/u
/** Six or more digits, even when spaced or hyphenated: phones, cards, order numbers. */
const DIGIT_RUN = /(?:\d[\s-]*){6,}/

/**
 * The text a gap is stored under, or `null` when the search must not be
 * recorded at all. Only this value ever reaches Sanity or a prompt, so the
 * privacy filters live here and nowhere else.
 */
export function normaliseGap(raw: string): string | null {
  const folded = raw.normalize('NFKC').toLowerCase()
  // Checked before stripping, which would remove the `@` and the dots.
  if (folded.includes('@') || URL_OR_DOMAIN.test(folded)) return null

  const text = folded
    .replace(/[^\p{L}\p{N} -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .trim()

  if (text.length < MIN_QUERY_LENGTH) return null
  if (text.split(' ').length > MAX_QUERY_WORDS) return null
  if (DIGIT_RUN.test(text)) return null
  return text
}
