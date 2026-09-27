import 'server-only'
import { analysePhoto, checkText } from '@repo/testimonials/analyse'
import { CODE_RESEND_SECONDS, CODE_TTL_MINUTES, MODEL } from '@repo/testimonials/constants'
import type { Draft } from '@repo/testimonials/draft'
import type { PromptProduct } from '@repo/testimonials/prompt'
import type { PhotoAnalysis, ReviewDecision, TextCheck } from '@repo/testimonials/schemas'
import { closeSubmission, publishTestimonial, writeSubmission } from '@repo/testimonials'
import { findProduct, getAllProducts } from '@/lib/api/products'
import { approvalEmail, codeEmail, rejectionEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { publicEnv } from '@/lib/env.public'
import { getWriteClient } from '@/lib/sanity/write-client'
import { sessionStore } from '@/lib/session/store'
import { deletePhotos, readPhoto } from './blob'
import { codeMatches, generateCode, hashCode } from './code'
import { photoUrl } from './photo-link'

/**
 * The bodies of the testimonial workflow's steps (workflows/testimonial.ts),
 * as plain functions so they can be tested without a workflow runtime. Each
 * does the I/O of one server tool and answers what the draft needs. Never
 * cached, and never reachable from a page's request path.
 */

const CODE_TTL_MS = CODE_TTL_MINUTES * 60_000

/** The whole catalogue as the analysis sees it, through the cached reader. */
export async function catalogue(): Promise<PromptProduct[]> {
  const products = await getAllProducts()
  return products.map(({ id, name, category, description }) => ({ id, name, category, description }))
}

/** The vision call on the run's photo. Candidates outside the catalogue are dropped. */
export async function analyse(pathname: string, products: readonly PromptProduct[]): Promise<PhotoAnalysis> {
  const image = await readPhoto(pathname)
  const analysis = await analysePhoto({ image, mediaType: 'image/jpeg', products })
  const known = new Set(products.map((product) => product.id))
  return { ...analysis, candidates: analysis.candidates.filter((candidate) => known.has(candidate.id)) }
}

/** The text check of the draft's name, quote and alt text. */
export async function screen(draft: Pick<Draft, 'name' | 'quote' | 'altText'>): Promise<TextCheck> {
  return checkText({ name: draft.name ?? '', quote: draft.quote ?? '', altText: draft.altText ?? '' })
}

export type CodeSent = { codeHash: string; expiresAt: string } | { waitSeconds: number }

/**
 * Emails a new code to the draft's address and answers its hash, or how long
 * to wait when the last code went out less than `CODE_RESEND_SECONDS` ago.
 */
export async function sendCode(runId: string, email: Draft['email'], now = Date.now()): Promise<CodeSent> {
  if (!email) throw new Error(`Run ${runId} has no email address to send a code to`)
  if (email.status === 'code-sent') {
    const sentAt = Date.parse(email.expiresAt) - CODE_TTL_MS
    const waitSeconds = Math.ceil((sentAt + CODE_RESEND_SECONDS * 1000 - now) / 1000)
    if (waitSeconds > 0) return { waitSeconds }
  }
  const code = generateCode()
  await sendEmail(email.address, codeEmail(code))
  return { codeHash: hashCode(runId, code), expiresAt: new Date(now + CODE_TTL_MS).toISOString() }
}

/** Whether `code` is the one last sent and has not expired. */
export function verifyCode(runId: string, email: Draft['email'], code: string, now = Date.now()): { verified: boolean } {
  if (email?.status !== 'code-sent' || Date.parse(email.expiresAt) <= now) return { verified: false }
  return { verified: codeMatches(runId, code, email.codeHash) }
}

function writeClient() {
  const client = getWriteClient()
  if (!client) throw new Error('SANITY_API_WRITE_TOKEN is not set, so nothing can be written.')
  return client
}

/** Writes the pending submission from the draft. */
export async function submit(runId: string, draft: Draft, now = new Date()): Promise<{ submittedAt: string }> {
  const client = writeClient()
  await writeSubmission(client, { runId, draft, photoUrl: photoUrl(runId), model: MODEL, now })
  return { submittedAt: now.toISOString() }
}

/** Deletes a run's photos, all but `keep` when it is given. */
export const dropPhotos = (runId: string, keep?: string) => deletePhotos(runId, keep)

/** Marks the conversation over, so the chat routes stop offering it. */
export async function endChat(runId: string): Promise<void> {
  if (!(await sessionStore.endChat(runId))) throw new Error(`Run ${runId} could not mark its chat ended`)
}

/**
 * Copies an accepted submission's photo into Sanity assets and publishes the
 * testimonial from the draft, with the editor's alt text.
 */
export async function publish(runId: string, draft: Draft, photoAlt: string, now = new Date()): Promise<string> {
  const { photo, name, quote, products } = draft
  if (!photo || !name || !quote || products.length === 0) {
    throw new Error(`The draft of run ${runId} has nothing to publish`)
  }
  const bytes = Buffer.from(await readPhoto(photo.pathname))
  return publishTestimonial(writeClient(), { runId, person: name, quote, products, photo: bytes, photoAlt, now })
}

const siteUrl = (path: string) => new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).href

/**
 * Emails the editor's decision to the draft's address. The idempotency key
 * makes Resend send it once, however often the step retries.
 */
export async function sendOutcome(runId: string, draft: Draft, decision: ReviewDecision): Promise<void> {
  const address = draft.email?.address
  if (!address) throw new Error(`Run ${runId} has no email address to send the outcome to`)
  let content
  if (decision.status === 'accepted') {
    const id = draft.products[0]
    const product = id ? await findProduct(id) : null
    if (!product) throw new Error(`Run ${runId} names no product the API knows`)
    content = approvalEmail({ name: product.name, url: siteUrl(`/products/${product.slug}`) })
  } else {
    content = rejectionEmail(decision.rejectionReason, siteUrl('/testimonials#share'))
  }
  await sendEmail(address, content, { idempotencyKey: `testimonial-outcome/${runId}` })
}

/** After the decision: the address and the photo link leave the submission. */
export async function closeDecision(runId: string, now = new Date()): Promise<void> {
  await closeSubmission(writeClient(), runId, now)
}
