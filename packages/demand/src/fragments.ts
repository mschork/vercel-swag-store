export interface FragmentCandidate {
  _id: string
  query: string
  count: number
}

/**
 * The search form navigates on a debounce, so someone typing "umbrella" slowly
 * also searches "umb" and "umbre". A gap is a typing fragment when another gap
 * starts with its text followed by more letters and was searched at least as
 * often. Returns each fragment's id with the query it is a fragment of (the
 * longest one, for the note an editor reads).
 */
export function typingFragments(gaps: readonly FragmentCandidate[]): Map<string, string> {
  const fragments = new Map<string, string>()
  for (const gap of gaps) {
    let whole: FragmentCandidate | undefined
    for (const other of gaps) {
      if (other._id === gap._id || other.count < gap.count) continue
      if (!other.query.startsWith(gap.query)) continue
      const next = other.query.charAt(gap.query.length)
      if (!/\p{L}/u.test(next)) continue
      if (!whole || other.query.length > whole.query.length) whole = other
    }
    if (whole) fragments.set(gap._id, whole.query)
  }
  return fragments
}
