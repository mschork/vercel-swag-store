import { CODE_TTL_MINUTES } from '@repo/testimonials/constants'

/** An email's content: plain HTML and a text part, no address. */
export interface EmailContent {
  subject: string
  html: string
  text: string
}

/** The verification code for a testimonial submission. */
export function codeEmail(code: string): EmailContent {
  const lines = [
    `Your code is ${code}.`,
    `Enter it in the chat to confirm your email address. It works for ${CODE_TTL_MINUTES} minutes.`,
    'If you did not ask for it, ignore this email.',
  ]
  return {
    subject: `${code} is your Vercel Swag Store code`,
    html: lines.map((line) => `<p>${line}</p>`).join(''),
    text: lines.join('\n\n'),
  }
}
