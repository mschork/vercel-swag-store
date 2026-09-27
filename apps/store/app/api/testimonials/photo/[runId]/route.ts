import { listPhotos, openPhoto } from '@/lib/testimonials/blob'
import { photoSignatureValid } from '@/lib/testimonials/photo-link'

/**
 * A submission's photo for the Studio's preview, authorised by the signature
 * in its link (`lib/testimonials/photo-link.ts`), since the Studio sends no
 * cookie. Serves the run's latest photo until the blob is deleted.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<'/api/testimonials/photo/[runId]'>,
): Promise<Response> {
  const { runId } = await params
  if (!photoSignatureValid(runId, new URL(request.url).searchParams.get('sig'))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pathname = (await listPhotos(runId)).at(-1)
  const stream = pathname ? await openPhoto(pathname) : null
  if (!stream) return Response.json({ error: 'Not found' }, { status: 404 })
  return new Response(stream, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' },
  })
}
