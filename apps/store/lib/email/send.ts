import 'server-only'
import { serverEnv } from '@/lib/env'
import type { EmailContent } from './templates'

const RESEND_URL = 'https://api.resend.com/emails'
/** Resend answers in well under a second; a slower call fails and its step retries. */
const SEND_TIMEOUT_MS = 10_000

/** The sender of every testimonial email. */
export const fromAddress = () => `testimonials@${serverEnv.EMAIL_DOMAIN ?? 'localhost'}`

export interface SendOptions {
  /**
   * Resend sends one email per key within a day, so a retried step that
   * already sent sends nothing more.
   */
  idempotencyKey?: string
}

/**
 * Sends one email through Resend over `fetch`. Without `RESEND_API_KEY` it
 * logs the subject and the text part instead, so the flow runs end to end
 * without a provider. The address and the key are never logged. Throws on
 * anything but a 2xx.
 */
export async function sendEmail(to: string, content: EmailContent, options: SendOptions = {}): Promise<void> {
  const key = serverEnv.RESEND_API_KEY
  if (!key) {
    console.info(`[email] from ${fromAddress()}: ${content.subject}\n${content.text}`)
    return
  }
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(options.idempotencyKey && { 'idempotency-key': options.idempotencyKey }),
    },
    body: JSON.stringify({
      from: `Vercel Swag Store <${fromAddress()}>`,
      to: [to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  })
  if (!response.ok) {
    // Only the error's name: Resend's message can quote the request.
    const body = (await response.json().catch(() => null)) as { name?: unknown } | null
    const name = typeof body?.name === 'string' ? ` (${body.name})` : ''
    throw new Error(`Resend answered ${response.status}${name}`)
  }
}
