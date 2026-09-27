import { z } from 'zod'
import {
  BLOB_PREFIX,
  CODE_LENGTH,
  MAX_CANDIDATES,
  NAME_MAX_LENGTH,
  PRODUCT_SOURCES,
  QUALITY_ISSUES,
  QUOTE_MAX_LENGTH,
  REJECTION_REASONS,
  SUBMISSION_TYPE,
} from './constants.ts'

/**
 * The trust boundaries of the testimonial agent: what the model answers, what
 * the browser sends back for a widget, and what the decision route receives.
 * Model schemas use nullable, never optional: some providers' structured
 * output requires every property to be present.
 */

const unit = z.number().min(0).max(1)

/** The one vision call on a photo. */
export const PhotoAnalysisSchema = z.object({
  quality: z.object({
    score: unit.describe('0 to 1: sharp, well lit, the item fills a fair part of the frame'),
    issues: z.array(z.enum(QUALITY_ISSUES)),
  }),
  safety: z.object({ ok: z.boolean(), reason: z.string().nullable() }),
  markVisible: z.boolean().describe('Is the store mark visible on an item in the photo?'),
  candidates: z
    .array(z.object({ id: z.string(), confidence: unit.describe('0 to 1') }))
    .max(MAX_CANDIDATES)
    .describe('Catalogue ids, most likely first; empty if nothing matches'),
  altText: z.string().max(200),
})
export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>

/** The small call that screens the visitor's words and the suggested alt text. */
export const TextCheckSchema = z.object({
  nameOk: z.boolean().describe('false if the name is abusive, obscene or a slur'),
  quoteOk: z.boolean().describe('false if the quote is abusive, obscene or contains a slur'),
  altTextOk: z.boolean().describe('false if the alt text is abusive, obscene or contains a slur'),
})
export type TextCheck = z.infer<typeof TextCheckSchema>

/** What `reviewQuote` shows: the visitor's words, or a shorter suggestion. */
export const ReviewQuoteInputSchema = z.object({ text: z.string().max(QUOTE_MAX_LENGTH) })

/** A widget the visitor typed past instead of answering. */
export const TypedInsteadSchema = z.object({ visitorTypedInstead: z.literal(true) })

/** Pathnames the upload route chooses: `testimonials/<runId>/<attempt>.jpg`. */
export const PhotoUploadedSchema = z.object({
  pathname: z.string().regex(new RegExp(`^${BLOB_PREFIX}[A-Za-z0-9_-]+/\\d+\\.jpg$`)),
})

export const ProductChoiceSchema = z.object({
  productId: z.string().min(1),
  others: z.array(z.string().min(1)).max(MAX_CANDIDATES),
})

export const NameSchema = z.object({ name: z.string().trim().min(1).max(NAME_MAX_LENGTH) })

/** Not trimmed: the published quote is exactly the text the visitor approved. */
export const QuoteSchema = z.object({
  quote: z
    .string()
    .max(QUOTE_MAX_LENGTH)
    .refine((quote) => quote.trim().length > 0, 'the quote is empty'),
})

export const ConsentSchema = z.object({ consent: z.boolean() })

/** The tool's answer; the address travels beside it and never reaches the model. */
export const EmailProvidedSchema = z.object({ provided: z.literal(true) })
export const EmailAddressSchema = z.email().max(254)

export const CodeSchema = z.object({ code: z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`)) })

/** What `sendCode` keeps in the run: the code's hash, never the code. */
export const CodeSentSchema = z.object({ codeHash: z.string().min(1), expiresAt: z.iso.datetime() })
export const CodeCheckedSchema = z.object({ verified: z.boolean() })

/** Why the analysis and the text check said what they said, kept for the editor. */
export const FindingsSchema = z.object({
  qualityScore: unit,
  qualityIssues: z.array(z.enum(QUALITY_ISSUES)),
  markVisible: z.boolean(),
  candidates: z.array(z.object({ id: z.string(), confidence: unit })),
  productSource: z.enum(PRODUCT_SOURCES),
  textCheck: TextCheckSchema,
  model: z.string(),
})
export type Findings = z.infer<typeof FindingsSchema>

/** The body the `submission-decided` Function posts to the decision route. */
export const DecisionSchema = z.discriminatedUnion('status', [
  z.object({
    _id: z.string().startsWith(`${SUBMISSION_TYPE}.`),
    runId: z.string().min(1),
    status: z.literal('accepted'),
    rejectionReason: z.null().optional(),
    photoAlt: z.string().trim().min(1),
  }),
  z.object({
    _id: z.string().startsWith(`${SUBMISSION_TYPE}.`),
    runId: z.string().min(1),
    status: z.literal('rejected'),
    rejectionReason: z.enum(REJECTION_REASONS),
    photoAlt: z.string().nullish(),
  }),
]).refine((decision) => decision._id === `${SUBMISSION_TYPE}.${decision.runId}`, {
  path: ['runId'],
  message: 'the run id does not match the submission',
})
export type Decision = z.infer<typeof DecisionSchema>
