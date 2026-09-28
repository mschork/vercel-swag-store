import type { SanityClient } from '@sanity/client'
import { SUBMISSION_TYPE, TESTIMONIAL_TYPE } from './constants.ts'
import { findingsOf, type Draft } from './draft.ts'

/**
 * Every write of the agent's documents, over a client the caller builds with
 * the write token. Both writes use `createIfNotExists`, so a retried step
 * writes once.
 */
export type TestimonialsClient = Pick<SanityClient, 'createIfNotExists' | 'patch' | 'assets'>

/** Dotted, so an anonymous client in this public dataset can never read it. */
export const submissionId = (runId: string) => `${SUBMISSION_TYPE}.${runId}`
export const testimonialId = (runId: string) => `${TESTIMONIAL_TYPE}-${runId}`
/** The product mirror's id, as `productId` in `@repo/sanity/catalogue-sync` builds it. */
export const productDocId = (apiId: string) => `product-${apiId}`

const productRefs = (apiIds: readonly string[], weak: boolean) =>
  apiIds.map((apiId) => ({
    _type: 'reference',
    _key: apiId,
    _ref: productDocId(apiId),
    ...(weak && { _weak: true }),
  }))

export interface SubmissionInput {
  runId: string
  draft: Draft
  /** The signed URL of the photo route, for the Studio's preview. */
  photoUrl: string
  model: string
  now?: Date
}

/**
 * Writes the pending submission from the draft, never from the model's
 * arguments. Product references are weak, so a rejected submission never
 * blocks deleting a mirror. Throws when the draft is incomplete.
 */
export async function writeSubmission(client: TestimonialsClient, input: SubmissionInput): Promise<string> {
  const { draft, runId } = input
  const findings = findingsOf(draft, input.model)
  if (!findings || !draft.name || !draft.quote || draft.email?.status !== 'verified') {
    throw new Error(`The draft of run ${runId} is not complete`)
  }
  const id = submissionId(runId)
  await client.createIfNotExists({
    _id: id,
    _type: SUBMISSION_TYPE,
    person: draft.name,
    quote: draft.quote,
    products: productRefs(draft.products, true),
    productSource: findings.productSource,
    email: draft.email.address,
    photoUrl: input.photoUrl,
    ...(draft.altText && { photoAlt: draft.altText }),
    findings: {
      ...findings,
      candidates: findings.candidates.map((candidate) => ({ _key: candidate.id, ...candidate })),
    },
    consentGiven: true,
    submittedAt: (input.now ?? new Date()).toISOString(),
    runId,
    status: 'pending',
  })
  return id
}

export interface TestimonialInput {
  runId: string
  person: string
  quote: string
  /** API ids, the confirmed product first. */
  products: readonly string[]
  photo: Parameters<TestimonialsClient['assets']['upload']>[1]
  photoAlt: string
  now?: Date
}

/**
 * Publishes an accepted submission as an ordinary testimonial. Sanity keys an
 * asset by its content, so a retried upload of the same photo returns the
 * same asset.
 */
export async function publishTestimonial(client: TestimonialsClient, input: TestimonialInput): Promise<string> {
  const asset = await client.assets.upload('image', input.photo, {
    filename: `${input.runId}.jpg`,
    contentType: 'image/jpeg',
  })
  const id = testimonialId(input.runId)
  await client.createIfNotExists({
    _id: id,
    _type: TESTIMONIAL_TYPE,
    person: input.person,
    photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: input.photoAlt },
    quote: input.quote,
    products: productRefs(input.products, false),
    consent: true,
    publishedAt: (input.now ?? new Date()).toISOString(),
    submission: { _type: 'reference', _ref: submissionId(input.runId), _weak: true },
  })
  return id
}

/** After the outcome email: the address and the photo link leave the submission. */
export async function closeSubmission(client: TestimonialsClient, runId: string, now: Date = new Date()) {
  await client
    .patch(submissionId(runId))
    .set({ decidedAt: now.toISOString() })
    .unset(['email', 'photoUrl'])
    .commit()
}
