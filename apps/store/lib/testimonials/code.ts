import 'server-only'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { CODE_LENGTH } from '@repo/testimonials/constants'

/** A fresh verification code, `CODE_LENGTH` digits. */
export const generateCode = () => String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')

/** What the run keeps instead of the code. Salted with the run id, so equal codes in two runs differ. */
export const hashCode = (runId: string, code: string) =>
  createHash('sha256').update(`${runId}:${code}`).digest('hex')

export function codeMatches(runId: string, code: string, codeHash: string): boolean {
  const actual = Buffer.from(hashCode(runId, code), 'hex')
  const expected = Buffer.from(codeHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
