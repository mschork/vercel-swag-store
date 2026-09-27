import 'server-only'
import { serverEnv } from '@/lib/env'

/**
 * Whether the store offers the testimonial chat: only with a Blob store for
 * the photos and a token to write the submission, and never on a preview,
 * which writes to the same dataset as production. Read at build time, so
 * every page that asks stays prerendered.
 */
export const chatOffered =
  Boolean(serverEnv.BLOB_STORE_ID && serverEnv.SANITY_API_WRITE_TOKEN) &&
  serverEnv.VERCEL_ENV !== 'preview'
