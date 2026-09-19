/**
 * The search-gap loop's numbers and vocabularies (specs/E13-search-gap-loop.md).
 * Plain values only: the Studio imports this file, so nothing here may pull in
 * Node built-ins.
 */

/** A gap is worth analysing once this many searches missed. */
export const ANALYSE_THRESHOLD = 2
/** A gap counts at most once per this many minutes, whoever searches. */
export const DEDUPE_MINUTES = 10
/** How long a run waits for sibling queries before claiming gaps. */
export const SETTLE = '10m'
/** No new gap is created while this many are open. */
export const MAX_OPEN_GAPS = 500
/** A gap under the threshold is deleted this long after it was last seen. */
export const RETENTION_DAYS = 30
export const MAX_GAPS_PER_RUN = 100
/**
 * AI Gateway model id. Sorting a few dozen short queries against a small
 * catalogue is an easy task, so the smallest model that AI Gateway's free tier
 * serves does it; the free tier refuses Anthropic models. Changing model is
 * this one line: the schema and the prompt hold for every provider.
 */
export const MODEL = 'openai/gpt-5-nano'

export const MAX_QUERY_LENGTH = 64
export const MIN_QUERY_LENGTH = 3
export const MAX_QUERY_WORDS = 6

export const GAP_STATUSES = ['new', 'analysing', 'reviewed', 'matched', 'ignored', 'promoted'] as const
export type GapStatus = (typeof GAP_STATUSES)[number]

export const IDEA_STATUSES = ['proposed', 'accepted', 'rejected'] as const
export type IdeaStatus = (typeof IDEA_STATUSES)[number]

export const GAP_TYPE = 'searchGap'
export const IDEA_TYPE = 'productIdea'
