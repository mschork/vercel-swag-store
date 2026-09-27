import { MIN_QUALITY_SCORE, type RejectionReason } from './constants.ts'
import type { Findings } from './schemas.ts'

/**
 * The rejection reason the Studio preselects, or `null` when the findings
 * point at none. A product the visitor picked is one no candidate matched
 * with confidence, so it is the likelier mistake.
 */
export function suggestReason(
  findings: Partial<Pick<Findings, 'qualityScore' | 'productSource'>> | null | undefined,
): RejectionReason | null {
  if (!findings) return null
  if (findings.qualityScore !== undefined && findings.qualityScore < MIN_QUALITY_SCORE) return 'photo'
  if (findings.productSource === 'visitor') return 'product'
  return null
}
