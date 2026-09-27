import { TURN_HOOK_PREFIX } from '@repo/testimonials/constants'
import { HookNotFoundError } from 'workflow/errors'
import { sessionStore } from '@/lib/session/store'
import { admit, ownChat, refuse, runLive } from '@/lib/testimonials/guard'
import { nextIndex, turnResponse } from '@/lib/testimonials/stream'
import { readChatBody, turnOf } from '@/lib/testimonials/turn-input'
import { turnHook } from '@/workflows/testimonial'

/** A run the upload route has just started may not have created its hook yet. */
const HOOK_TRIES = 5
const HOOK_RETRY_MS = 400

/**
 * A widget answer, a typed message or a photo chosen in the greeting: resumes
 * the run's turn hook and streams the turn it starts. The turn's first index
 * is saved before the hook resumes, so a reconnect replays exactly this turn.
 * 410 when the run has ended.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<'/api/testimonials/chat/[runId]/message'>,
): Promise<Response> {
  const { runId } = await params
  const admitted = await admit(request)
  if (admitted instanceof Response) return admitted
  const chat = await ownChat(runId, admitted.sid)
  if (chat instanceof Response) return chat
  const body = await readChatBody(request)
  const input = body && turnOf(body, runId)
  if (!body || !input) return refuse(400, 'Invalid body')

  const turnStart = await nextIndex(runId)
  if (!(await sessionStore.saveChat(runId, { sid: admitted.sid, messages: body.messages, turnStart }))) {
    return refuse(503, 'Try again')
  }
  for (let attempt = 1; ; attempt++) {
    try {
      await turnHook.resume(`${TURN_HOOK_PREFIX}${runId}`, input)
      return turnResponse(runId, turnStart)
    } catch (error) {
      if (!HookNotFoundError.is(error)) throw error
      if (attempt >= HOOK_TRIES || !(await runLive(runId))) return refuse(410, 'The conversation has ended')
      await new Promise((resolve) => setTimeout(resolve, HOOK_RETRY_MS))
    }
  }
}
