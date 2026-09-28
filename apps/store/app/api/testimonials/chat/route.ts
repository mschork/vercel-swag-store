import { TURN_HOOK_PREFIX } from '@repo/testimonials/constants'
import { start } from 'workflow/api'
import { HookNotFoundError } from 'workflow/errors'
import { sessionStore } from '@/lib/session/store'
import { admit, ownChat, refuse, runLive } from '@/lib/testimonials/guard'
import { turnResponse } from '@/lib/testimonials/stream'
import { readChatBody, turnOf } from '@/lib/testimonials/turn-input'
import { testimonial, turnHook } from '@/workflows/testimonial'

/**
 * The testimonial chat of this session (specs/E25-testimonial-agent.md).
 * GET answers the conversation still going, with the browser's messages, so
 * a reload can resume it; POST starts one with the name entered in the
 * greeting, or a typed first message, and streams its first turn; DELETE
 * ends the one still going, when the visitor closes the chat.
 */

export async function GET(request: Request): Promise<Response> {
  const admitted = await admit(request, { rateLimit: false })
  if (admitted instanceof Response) return admitted
  const runId = await sessionStore.currentChat(admitted.sid)
  if (runId === 'unavailable' || runId === null) return Response.json(null)
  const [live, chat] = await Promise.all([runLive(runId), ownChat(runId, admitted.sid)])
  if (!live || chat instanceof Response) return Response.json(null)
  return Response.json({ runId, messages: chat.messages })
}

export async function POST(request: Request): Promise<Response> {
  const admitted = await admit(request)
  if (admitted instanceof Response) return admitted
  const body = await readChatBody(request)
  const input = body && turnOf(body)
  if (!body || (input?.kind !== 'message' && input?.kind !== 'name')) return refuse(400, 'Invalid body')

  const run = await start(testimonial, [input])
  const saved =
    (await sessionStore.openChat(admitted.sid, run.runId)) &&
    (await sessionStore.saveChat(run.runId, { sid: admitted.sid, messages: body.messages, turnStart: 0 }))
  if (!saved) {
    await run.cancel().catch(() => {})
    return refuse(503, 'Try again')
  }
  return turnResponse(run.runId, 0)
}

/**
 * Ends the session's conversation: marked ended at once, so opening the chat
 * again shows the greeting, then the run leaves its loop and deletes the
 * photos as it does when idle. A submitted run no longer takes turns, so it
 * goes on waiting for the editor. 204 whether or not a conversation was going.
 */
export async function DELETE(request: Request): Promise<Response> {
  const admitted = await admit(request, { rateLimit: false })
  if (admitted instanceof Response) return admitted
  const runId = await sessionStore.currentChat(admitted.sid)
  if (runId === 'unavailable') return refuse(503, 'Try again')
  if (runId !== null && (await sessionStore.chatEnded(runId)) !== true) {
    if (!(await sessionStore.endChat(runId))) return refuse(503, 'Try again')
    await turnHook.resume(`${TURN_HOOK_PREFIX}${runId}`, { kind: 'close' }).catch((error: unknown) => {
      if (!HookNotFoundError.is(error)) throw error
    })
  }
  return new Response(null, { status: 204 })
}
