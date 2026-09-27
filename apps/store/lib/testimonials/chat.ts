import 'server-only'
import { serverEnv } from '@/lib/env'

/**
 * Whether the store offers the testimonial chat: only with a Blob store for
 * the photos, a token to write the submission and the secret that signs its
 * photo link, and never on a preview, which writes to the same dataset as
 * production. Read at build time, so every page that asks stays prerendered.
 * The testimonial routes answer 404 without it.
 */
export const chatOffered =
  Boolean(
    serverEnv.BLOB_STORE_ID &&
      serverEnv.SANITY_API_WRITE_TOKEN &&
      serverEnv.TESTIMONIAL_PHOTO_SECRET,
  ) &&
  serverEnv.VERCEL_ENV !== 'preview'
