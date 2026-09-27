import 'server-only'
import { RATE_LIMIT_RULE } from '@repo/testimonials/constants'
import { checkRateLimit } from '@vercel/firewall'
import { checkBotId } from 'botid/server'
import { getRun } from 'workflow/api'
import { getSessionId } from '@/lib/session/cookie'
import { sessionStore, type ChatRecord } from '@/lib/session/store'
import { chatOffered } from './chat'

/**
 * The checks every testimonial chat route makes before it does anything:
 * the chat is offered, the caller is no bot, within the rate limit, and has
 * a session; and, for a run, that the run is bound to that session.
 */

export const refuse = (status: number, error: string) => Response.json({ error }, { status })

/** The request's session id, or the response that refuses it. */
export async function admit(request: Request, { rateLimit = true } = {}): Promise<{ sid: string } | Response> {
  if (!chatOffered) return refuse(404, 'Not found')
  // Both throw outside Vercel: BotID under `next start`, and the rate limit
  // without the IP address Vercel's proxy adds.
  if (process.env.VERCEL) {
    const { isBot } = await checkBotId()
    if (isBot) return refuse(403, 'Forbidden')
    if (rateLimit) {
      const { rateLimited } = await checkRateLimit(RATE_LIMIT_RULE, { request })
      if (rateLimited) return refuse(429, 'Too many requests')
    }
  }
  const sid = await getSessionId()
  if (!sid) return refuse(401, 'No session')
  return { sid }
}

/** The run's chat record when it is bound to `sid`, or the response that refuses it. */
export async function ownChat(runId: string, sid: string): Promise<ChatRecord | Response> {
  const chat = await sessionStore.readChat(runId)
  if (chat === 'unavailable') return refuse(503, 'Try again')
  if (!chat || chat.sid !== sid) return refuse(404, 'Not found')
  return chat
}

/** Whether the run is still going, so it can take another turn. */
export async function runLive(runId: string): Promise<boolean> {
  const status = await getRun(runId).status.catch(() => null)
  return status === 'pending' || status === 'running'
}
