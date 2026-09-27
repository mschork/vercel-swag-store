import 'server-only'
import { serverEnv } from '@/lib/env'
import type { EmailContent } from './templates'

/** The sender of every testimonial email. */
export const fromAddress = () => `testimonials@${serverEnv.EMAIL_DOMAIN ?? 'localhost'}`

/**
 * Sends one email. This adapter logs the subject and the text part instead,
 * so the flow runs end to end without a provider; the address is never
 * logged.
 */
export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  void to
  console.info(`[email] from ${fromAddress()}: ${content.subject}\n${content.text}`)
}
