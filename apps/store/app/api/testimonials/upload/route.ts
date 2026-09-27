import { MAX_PHOTO_ATTEMPTS } from '@repo/testimonials/constants'
import { PhotoUploadedSchema, photoPathname, runIdOfPathname } from '@repo/testimonials/schemas'
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'
import { z } from 'zod'
import { sessionStore } from '@/lib/session/store'
import { signUpload } from '@/lib/testimonials/blob'
import { admit, ownChat, refuse, runLive } from '@/lib/testimonials/guard'

/**
 * A photo upload to the private Blob store, in two calls. `reserve` answers
 * the pathname the photo goes to, `testimonials/<runId>/<attempt>.jpg`, and
 * refuses past `MAX_PHOTO_ATTEMPTS`. The browser then asks `uploadPresigned` for that
 * pathname, and the route signs one JPEG `put` to it, over OIDC, once the
 * pathname belongs to a live run of this session. The SDK sends the browser's
 * own pathname with the upload, so the route cannot choose it at signing.
 */

const ReserveSchema = z.object({ type: z.literal('reserve'), runId: z.string().min(1) })

export async function POST(request: Request): Promise<Response> {
  const admitted = await admit(request)
  if (admitted instanceof Response) return admitted
  const body: unknown = await request.json().catch(() => null)

  const reserve = ReserveSchema.safeParse(body)
  if (reserve.success) return reservePathname(admitted.sid, reserve.data.runId)

  const issue = body as HandleUploadPresignedBody | null
  // No upload-completed callback is registered, so only issuance is served.
  if (issue?.type !== 'blob.generate-presigned-url') return refuse(400, 'Invalid body')
  const { pathname } = issue.payload
  const runId = PhotoUploadedSchema.safeParse({ pathname }).success ? runIdOfPathname(pathname) : null
  if (!runId) return refuse(400, 'Invalid pathname')
  const chat = await ownChat(runId, admitted.sid)
  if (chat instanceof Response) return chat
  if (!(await runLive(runId))) return refuse(410, 'The conversation has ended')

  const result = await handleUploadPresigned({
    body: issue,
    request,
    // The SDK demands a key, which only verifies upload-completed callbacks.
    webhookPublicKey: 'unused',
    getSignedToken: async (signed) => ({ token: await signUpload(signed) }),
  })
  return Response.json(result)
}

async function reservePathname(sid: string, runId: string): Promise<Response> {
  const chat = await ownChat(runId, sid)
  if (chat instanceof Response) return chat
  if (!(await runLive(runId))) return refuse(410, 'The conversation has ended')
  const attempt = await sessionStore.countUpload(runId)
  if (attempt === null) return refuse(503, 'Try again')
  if (attempt > MAX_PHOTO_ATTEMPTS) return refuse(409, 'No uploads left')
  return Response.json({ pathname: photoPathname(runId, attempt) })
}
