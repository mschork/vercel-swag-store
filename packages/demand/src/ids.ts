import { createHash } from 'node:crypto'
import { GAP_TYPE, IDEA_TYPE } from './constants.ts'

const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16)

/**
 * Ids carry a dot on purpose: Sanity keeps a dotted id private, so an
 * anonymous client in this public dataset can never read a gap or an idea.
 */
export const gapId = (normalised: string) => `${GAP_TYPE}.${hash(normalised)}`

/** Same gaps, same idea, whatever their order: a re-run cannot create a second one. */
export const ideaId = (gapIds: readonly string[]) => `${IDEA_TYPE}.${hash([...gapIds].sort().join('|'))}`
