import { start } from 'workflow/api'
import { sessionStore } from '@/lib/session/store'
import { admit, ownChat, refuse, runLive } from '@/lib/testimonials/guard'
import { turnResponse } from '@/lib/testimonials/stream'
import { readChatBody, turnOf } from '@/lib/testimonials/turn-input'
import { testimonial } from '@/workflows/testimonial'

/**
 * The testimonial chat of this session (specs/E25-testimonial-agent.md).
 * GET answers the conversation still going, with the browser's messages, so
 * a reload can resume it; POST starts one with a typed first message and
 * streams its first turn.
 */

export async function GET(request: Request): Promise<Response> {
  const admitted = await admit(request, { rateLimit: false })
  if (admitted instanceof Response) return admitted
  const runId = await sessionStore.currentChat(admitted.sid)
  if (runId === 'unavailable' || runId === null || !(await runLive(runId))) return Response.json(null)
  const chat = await ownChat(runId, admitted.sid)
  if (chat instanceof Response) return Response.json(null)
  return Response.json({ runId, messages: chat.messages })
}

export async function POST(request: Request): Promise<Response> {
  const admitted = await admit(request)
  if (admitted instanceof Response) return admitted
  const body = await readChatBody(request)
  const input = body && turnOf(body)
  if (!body || input?.kind !== 'message') return refuse(400, 'Invalid body')

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
