import { getSessionId } from '@/lib/session/cookie'
import { readChat } from '@/lib/testimonials-spike/chat-store'
import { turnResponse } from '@/lib/testimonials-spike/turn-stream'

/** Spike: reconnects to the current turn after a reload or a dropped response. */
export async function GET(request: Request, ctx: RouteContext<'/api/testimonials/chat/[runId]/stream'>) {
  const { runId } = await ctx.params
  const sid = await getSessionId()
  const chat = await readChat(runId)
  if (!sid || chat?.sid !== sid) return Response.json({ error: 'Not your run' }, { status: 403 })
  const startIndex = Number(new URL(request.url).searchParams.get('startIndex') ?? 0)
  return turnResponse(runId, chat.turnStart, Math.max(0, startIndex))
}
