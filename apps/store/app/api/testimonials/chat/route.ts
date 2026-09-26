import type { UIMessage } from 'ai'
import { checkBotId } from 'botid/server'
import { start } from 'workflow/api'
import { getSessionId } from '@/lib/session/cookie'
import { saveChat } from '@/lib/testimonials-spike/chat-store'
import { turnResponse } from '@/lib/testimonials-spike/turn-stream'
import { testimonialSpike } from '@/workflows/testimonial-spike'

/** Spike: the first message starts the run and streams its first turn. */
export async function POST(request: Request): Promise<Response> {
  const verdict = await checkBotId()
  console.log('[spike] botid', JSON.stringify(verdict))
  if (verdict.isBot) return Response.json({ error: 'Bot' }, { status: 403 })
  const sid = await getSessionId()
  if (!sid) return Response.json({ error: 'No session' }, { status: 401 })
  const { messages } = (await request.json()) as { messages: UIMessage[] }
  const text = messages.at(-1)?.parts.find((p) => p.type === 'text')?.text ?? ''
  const run = await start(testimonialSpike, [{ firstMessage: text }])
  await saveChat(run.runId, { sid, messages, turnStart: 0 })
  return turnResponse(run.runId, 0)
}
