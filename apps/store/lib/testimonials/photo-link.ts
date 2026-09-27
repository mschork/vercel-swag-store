import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { publicEnv } from '@/lib/env.public'
import { serverEnv } from '@/lib/env'

/**
 * The Studio's link to a submission's photo: the photo route with an HMAC of
 * the run id, keyed with `TESTIMONIAL_PHOTO_SECRET`. The Studio sends no
 * cookie, so the signature is the only authorisation.
 */

const sign = (runId: string, secret: string) => createHmac('sha256', secret).update(runId).digest('hex')

/** The signed URL written onto the submission. Throws without the secret. */
export function photoUrl(runId: string): string {
  const secret = serverEnv.TESTIMONIAL_PHOTO_SECRET
  if (!secret) throw new Error('TESTIMONIAL_PHOTO_SECRET is not set')
  const url = new URL(`/api/testimonials/photo/${encodeURIComponent(runId)}`, publicEnv.NEXT_PUBLIC_SITE_URL)
  url.searchParams.set('sig', sign(runId, secret))
  return url.toString()
}

/** Whether `sig` is the run id's signature; `false` without the secret. */
export function photoSignatureValid(runId: string, sig: string | null): boolean {
  const secret = serverEnv.TESTIMONIAL_PHOTO_SECRET
  if (!secret || !sig) return false
  const expected = Buffer.from(sign(runId, secret), 'hex')
  const actual = Buffer.from(sig, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
