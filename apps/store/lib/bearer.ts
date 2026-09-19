import { timingSafeEqual } from 'node:crypto'

/**
 * Constant-time comparison of an `Authorization: Bearer` header with a shared
 * secret. An unset secret authorises nobody.
 */
export function authorised(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith('Bearer ')) return false
  const presented = Buffer.from(header.slice('Bearer '.length))
  const expected = Buffer.from(secret)
  return presented.length === expected.length && timingSafeEqual(presented, expected)
}
