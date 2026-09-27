import { MAX_PHOTO_EDGE, MAX_UPLOAD_BYTES, UPLOAD_TIMEOUT_SECONDS } from '@repo/testimonials/constants'
import { uploadPresigned } from '@vercel/blob/client'

const JPEG_QUALITY = 0.85

/**
 * The photo downsized to `MAX_PHOTO_EDGE` and re-encoded as JPEG through a
 * canvas, which drops its EXIF data, location included. The browser applies
 * the EXIF orientation while decoding, so the photo keeps its way up.
 */
export async function reencode(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!jpeg) throw new Error('The photo could not be read.')
  if (jpeg.size > MAX_UPLOAD_BYTES) throw new Error('The photo is too large.')
  return jpeg
}

const UPLOAD_ROUTE = '/api/testimonials/upload'

/** Why an upload failed, for the widget to say. */
export class UploadError extends Error {
  constructor(readonly reason: 'no-uploads-left' | 'ended' | 'failed') {
    super(reason)
  }
}

/**
 * Uploads a re-encoded photo to the private Blob store and answers its
 * pathname. The route first reserves the pathname; `runId` is `null` when
 * the photo is the visitor's first action, and the route then starts the
 * run. Aborted after `UPLOAD_TIMEOUT_SECONDS`, because a refused request is
 * retried silently.
 */
export async function uploadPhoto(jpeg: Blob, runId: string | null): Promise<string> {
  const signal = AbortSignal.timeout(UPLOAD_TIMEOUT_SECONDS * 1000)
  const reserved = await fetch(UPLOAD_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'reserve', runId }),
    signal,
  })
  if (reserved.status === 409) throw new UploadError('no-uploads-left')
  if (reserved.status === 410) throw new UploadError('ended')
  if (!reserved.ok) throw new UploadError('failed')
  const { pathname } = (await reserved.json()) as { pathname: string }
  await uploadPresigned(pathname, jpeg, {
    access: 'private',
    contentType: 'image/jpeg',
    handleUploadUrl: UPLOAD_ROUTE,
    abortSignal: signal,
  })
  return pathname
}

/** The run a pathname `testimonials/<runId>/<attempt>.jpg` belongs to. */
export const runOfPathname = (pathname: string) => pathname.split('/')[1] ?? null
