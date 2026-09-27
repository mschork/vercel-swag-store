import 'server-only'
import { del, get, issueSignedToken, list, type IssuedSignedToken } from '@vercel/blob'
import { MAX_UPLOAD_BYTES } from '@repo/testimonials/constants'
import { photoPrefix } from '@repo/testimonials/schemas'
import { serverEnv } from '@/lib/env'

/**
 * The private Blob store that holds testimonial photos until an editor
 * decides (docs/adr/0008-testimonial-submissions.md). Every call names the
 * store, so the SDK authenticates over the deployment's OIDC token.
 */

const store = () => {
  if (!serverEnv.BLOB_STORE_ID) throw new Error('BLOB_STORE_ID is not set')
  return { storeId: serverEnv.BLOB_STORE_ID }
}

/** A token the browser may use for one `put` of one JPEG to `pathname`. */
export function signUpload(pathname: string): Promise<IssuedSignedToken> {
  return issueSignedToken({
    ...store(),
    pathname,
    operations: ['put'],
    allowedContentTypes: ['image/jpeg'],
    maximumSizeInBytes: MAX_UPLOAD_BYTES,
  })
}

/** A photo as a stream, or `null` when it is gone. */
export async function openPhoto(pathname: string): Promise<ReadableStream<Uint8Array> | null> {
  const result = await get(pathname, { ...store(), access: 'private' })
  return result?.statusCode === 200 ? result.stream : null
}

/** A photo's bytes. Throws when it is gone. */
export async function readPhoto(pathname: string): Promise<Uint8Array> {
  const stream = await openPhoto(pathname)
  if (!stream) throw new Error(`The photo ${pathname} is gone`)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** The pathnames of a run's photos. */
export async function listPhotos(runId: string): Promise<string[]> {
  const { blobs } = await list({ ...store(), prefix: photoPrefix(runId) })
  return blobs.map((blob) => blob.pathname).sort()
}

/** Deletes a run's photos, all but `keep` when it is given. */
export async function deletePhotos(runId: string, keep?: string): Promise<void> {
  const doomed = (await listPhotos(runId)).filter((pathname) => pathname !== keep)
  if (doomed.length > 0) await del(doomed, store())
}
