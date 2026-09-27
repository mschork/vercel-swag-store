import { CODE_TTL_MINUTES, type RejectionReason } from '@repo/testimonials/constants'

/** An email's content: plain HTML and a text part, no address. */
export interface EmailContent {
  subject: string
  html: string
  text: string
}

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

/** Paragraphs of plain text, escaped for the HTML part. */
const content = (subject: string, paragraphs: string[]): EmailContent => ({
  subject,
  html: paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(''),
  text: paragraphs.join('\n\n'),
})

/** The verification code for a testimonial submission. */
export function codeEmail(code: string): EmailContent {
  return content(`${code} is your Vercel Swag Store code`, [
    `Your code is ${code}.`,
    `Enter it in the chat to confirm your email address. It works for ${CODE_TTL_MINUTES} minutes.`,
    'If you did not ask for it, ignore this email.',
  ])
}

/** An accepted submission: the testimonial is live on the product's page. */
export function approvalEmail(product: { name: string; url: string }): EmailContent {
  const paragraphs = [
    `Thank you. Your testimonial for the ${product.name} is now on the Vercel Swag Store.`,
    `See it on the product page: ${product.url}`,
  ]
  return {
    ...content('Your testimonial is live', paragraphs),
    html:
      `<p>${escapeHtml(paragraphs[0] ?? '')}</p>` +
      `<p><a href="${escapeHtml(product.url)}">See it on the product page</a></p>`,
  }
}

/** One sentence per reason an editor can pick. Editors never type email text. */
const REJECTION_SENTENCES: Record<RejectionReason, string> = {
  photo: 'We could not use the photo: the product was not clear enough in it.',
  product: 'We could not match the photo to a product the store sells.',
  content: 'We could not publish the words or the name as they were.',
  other: 'It did not fit what we publish on the store this time.',
}

/** A rejected submission: the reason, and an invitation to try again. */
export function rejectionEmail(reason: RejectionReason, tryAgainUrl: string): EmailContent {
  return content('About your testimonial', [
    `Thank you for your testimonial. ${REJECTION_SENTENCES[reason]}`,
    `You are welcome to try again with a new one: ${tryAgainUrl}`,
  ])
}
