import { admit, ownChat } from '@/lib/testimonials/guard'
import { turnResponse } from '@/lib/testimonials/stream'

/**
 * Reconnects to the run's current turn after a reload or a dropped response.
 * `startIndex` is the number of chunks of the turn the browser already has.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<'/api/testimonials/chat/[runId]/stream'>,
): Promise<Response> {
  const { runId } = await params
  const admitted = await admit(request, { rateLimit: false })
  if (admitted instanceof Response) return admitted
  const chat = await ownChat(runId, admitted.sid)
  if (chat instanceof Response) return chat
  const startIndex = Number(new URL(request.url).searchParams.get('startIndex'))
  const skip = Number.isSafeInteger(startIndex) && startIndex > 0 ? startIndex : 0
  return turnResponse(runId, chat.turnStart, skip)
}
