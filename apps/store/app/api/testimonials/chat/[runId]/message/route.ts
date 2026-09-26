import type { UIMessage } from 'ai'
import { getSessionId } from '@/lib/session/cookie'
import { readChat, saveChat } from '@/lib/testimonials-spike/chat-store'
import { nextIndex, turnResponse } from '@/lib/testimonials-spike/turn-stream'
import { turnHook, type TurnInput } from '@/workflows/testimonial-spike'

/** Spike: a widget answer or a typed message resumes the run's turn hook. */
export async function POST(request: Request, ctx: RouteContext<'/api/testimonials/chat/[runId]/message'>) {
  const { runId } = await ctx.params
  const sid = await getSessionId()
  const chat = await readChat(runId)
  if (!sid || chat?.sid !== sid) return Response.json({ error: 'Not your run' }, { status: 403 })

  const { messages, email } = (await request.json()) as { messages: UIMessage[]; email?: string }
  const last = messages.at(-1)
  let input: TurnInput | null = null
  if (last?.role === 'user') {
    input = { kind: 'message', text: last.parts.find((p) => p.type === 'text')?.text ?? '' }
  } else if (last?.role === 'assistant') {
    const answered = [...last.parts].reverse().find(
      (p) => p.type.startsWith('tool-') && 'state' in p && p.state === 'output-available',
    ) as { type: string; toolCallId: string; output: unknown } | undefined
    if (answered) {
      input = {
        kind: 'tool',
        toolCallId: answered.toolCallId,
        toolName: answered.type.slice('tool-'.length),
        output: answered.output,
        ...(email ? { email } : {}),
      }
    }
  }
  if (!input) return Response.json({ error: 'Nothing to send' }, { status: 400 })

  const turnStart = await nextIndex(runId)
  await saveChat(runId, { sid, messages, turnStart })
  await turnHook.resume(`testimonial-turn:${runId}`, input)
  return turnResponse(runId, turnStart)
}
