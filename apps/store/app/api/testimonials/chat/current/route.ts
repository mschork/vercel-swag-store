import { getSessionId } from '@/lib/session/cookie'
import { currentRun, readChat } from '@/lib/testimonials-spike/chat-store'

/** Spike: the session's run and its stored messages, for a reload. */
export async function GET() {
  const sid = await getSessionId()
  const runId = sid ? await currentRun(sid) : null
  const chat = runId ? await readChat(runId) : null
  return Response.json(chat && runId ? { runId, messages: chat.messages } : null)
}
