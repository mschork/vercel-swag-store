import {
  CODE_MAX_ATTEMPTS,
  DRAFT_FACTS,
  MAX_PHOTO_ATTEMPTS,
  MIN_QUALITY_SCORE,
  PRODUCT_CONFIDENCE,
  type DraftFact,
  type ProductSource,
} from './constants.ts'
import type { Findings, PhotoAnalysis, TextCheck } from './schemas.ts'

/**
 * The submission while the conversation is going (CONTEXT.md). It lives in
 * the run, and only `applyToolResult` changes it, so the model cannot invent a
 * product, a verified email or consent. Product ids are the API's.
 */
export interface Draft {
  /** Uploads so far, whatever became of them. */
  attempts: number
  photo: { pathname: string } | null
  analysis: PhotoAnalysis | null
  product: { id: string; source: ProductSource } | null
  /** The confirmed product first, then any others the visitor confirmed. */
  products: string[]
  name: string | null
  quote: string | null
  /** Suggested by the analysis; dropped when the text check refuses it. */
  altText: string | null
  /** The check of the current name, quote and alt text; cleared when any of them changes. */
  textCheck: TextCheck | null
  consent: boolean
  email: EmailState | null
  submittedAt: string | null
}

export type EmailState =
  | { address: string; status: 'provided' }
  | { address: string; status: 'code-sent'; codeHash: string; expiresAt: string; attemptsLeft: number }
  | { address: string; status: 'verified' }

/** A tool's result as the run applies it. Outputs are parsed before they get here. */
export type DraftEvent =
  | { tool: 'askPhoto'; output: { pathname: string } }
  | { tool: 'analysePhoto'; output: PhotoAnalysis }
  | { tool: 'confirmProduct'; output: { productId: string; others: string[] } }
  | { tool: 'askName'; output: { name: string } }
  | { tool: 'reviewQuote'; output: { quote: string } }
  | { tool: 'checkText'; output: TextCheck }
  | { tool: 'askConsent'; output: { consent: boolean } }
  | { tool: 'askEmail'; output: { provided: true }; email: string }
  | { tool: 'sendCode'; output: { codeHash: string; expiresAt: string } }
  | { tool: 'verifyCode'; output: { verified: boolean } }
  | { tool: 'submit'; output: { submittedAt: string } }

export type PhotoVerdict = 'ok' | 'unsafe' | 'unusable' | 'no-mark' | 'no-match'

export const emptyDraft = (): Draft => ({
  attempts: 0,
  photo: null,
  analysis: null,
  product: null,
  products: [],
  name: null,
  quote: null,
  altText: null,
  textCheck: null,
  consent: false,
  email: null,
  submittedAt: null,
})

/** The candidates that count: the mark is visible and the confidence reaches the bar. */
export function countingCandidates(analysis: PhotoAnalysis | null): PhotoAnalysis['candidates'] {
  if (!analysis?.markVisible) return []
  return analysis.candidates.filter((candidate) => candidate.confidence >= PRODUCT_CONFIDENCE)
}

/** Why a photo cannot go further, most serious first, or `ok`. */
export function photoVerdict(analysis: PhotoAnalysis): PhotoVerdict {
  if (!analysis.safety.ok) return 'unsafe'
  if (analysis.quality.score < MIN_QUALITY_SCORE || analysis.quality.issues.includes('no-item')) {
    return 'unusable'
  }
  if (!analysis.markVisible) return 'no-mark'
  if (countingCandidates(analysis).length === 0) return 'no-match'
  return 'ok'
}

export const photoAttemptsLeft = (draft: Draft) => Math.max(0, MAX_PHOTO_ATTEMPTS - draft.attempts)

/**
 * The draft after one tool result. A submitted draft never changes. The run
 * checks product ids against the catalogue before it applies them.
 */
export function applyToolResult(draft: Draft, event: DraftEvent): Draft {
  if (draft.submittedAt) return draft
  switch (event.tool) {
    case 'askPhoto':
      if (photoAttemptsLeft(draft) === 0) return draft
      // Consent names the photo, so a new photo needs it again.
      return {
        ...draft,
        attempts: draft.attempts + 1,
        photo: { pathname: event.output.pathname },
        analysis: null,
        product: null,
        products: [],
        altText: null,
        textCheck: null,
        consent: false,
      }
    case 'analysePhoto':
      if (!draft.photo) return draft
      return { ...draft, analysis: event.output, altText: event.output.altText, textCheck: null }
    case 'confirmProduct': {
      if (!draft.photo) return draft
      const { productId, others } = event.output
      const identified = countingCandidates(draft.analysis).some((c) => c.id === productId)
      return {
        ...draft,
        product: { id: productId, source: identified ? 'agent' : 'visitor' },
        products: [...new Set([productId, ...others])],
      }
    }
    case 'askName':
      return { ...draft, name: event.output.name, textCheck: null }
    case 'reviewQuote':
      return { ...draft, quote: event.output.quote, textCheck: null }
    case 'checkText': {
      const check = event.output
      return {
        ...draft,
        name: check.nameOk ? draft.name : null,
        quote: check.quoteOk ? draft.quote : null,
        altText: check.altTextOk ? draft.altText : null,
        textCheck: check,
      }
    }
    case 'askConsent':
      return { ...draft, consent: event.output.consent }
    case 'askEmail':
      return { ...draft, email: { address: event.email, status: 'provided' } }
    case 'sendCode':
      if (!draft.email) return draft
      return {
        ...draft,
        email: {
          address: draft.email.address,
          status: 'code-sent',
          codeHash: event.output.codeHash,
          expiresAt: event.output.expiresAt,
          attemptsLeft: CODE_MAX_ATTEMPTS,
        },
      }
    case 'verifyCode': {
      const email = draft.email
      if (email?.status !== 'code-sent') return draft
      if (event.output.verified) return { ...draft, email: { address: email.address, status: 'verified' } }
      const attemptsLeft = email.attemptsLeft - 1
      // With no tries left the code is spent, and only a new one can verify.
      return {
        ...draft,
        email:
          attemptsLeft > 0
            ? { ...email, attemptsLeft }
            : { address: email.address, status: 'provided' },
      }
    }
    case 'submit':
      return missingFacts(draft).length === 0 ? { ...draft, submittedAt: event.output.submittedAt } : draft
  }
}

/** Whether one fact is settled. A name or a quote counts only once the text check passed it. */
function has(draft: Draft, fact: DraftFact): boolean {
  switch (fact) {
    case 'photo': {
      const verdict = draft.analysis && photoVerdict(draft.analysis)
      // A photo without a match still serves once the visitor picks the product.
      return Boolean(draft.photo && verdict && verdict !== 'unsafe' && verdict !== 'unusable')
    }
    case 'product':
      return draft.product !== null
    case 'name':
      return draft.name !== null && draft.textCheck?.nameOk === true
    case 'quote':
      return draft.quote !== null && draft.textCheck?.quoteOk === true
    case 'consent':
      return draft.consent
    case 'email':
      return draft.email?.status === 'verified'
  }
}

/** The facts still missing, in the order the draft card lists them. */
export const missingFacts = (draft: Draft): DraftFact[] => DRAFT_FACTS.filter((fact) => !has(draft, fact))

/** What the draft card shows. No address and no code hash: the model never writes it, but it is streamed. */
export interface DraftView {
  /** Whether a photo is in; the card shows the browser's own copy of it. */
  photo: boolean
  /** The analysis's candidates, most likely first, and whether each counts. */
  candidates: { id: string; counts: boolean }[]
  product: string | null
  products: string[]
  name: string | null
  quote: string | null
  consent: boolean
  email: EmailState['status'] | null
  missing: DraftFact[]
  photoAttemptsLeft: number
  submitted: boolean
}

export function draftView(draft: Draft): DraftView {
  const counting = new Set(countingCandidates(draft.analysis).map((candidate) => candidate.id))
  return {
    photo: draft.photo !== null,
    candidates: (draft.analysis?.candidates ?? []).map(({ id }) => ({ id, counts: counting.has(id) })),
    product: draft.product?.id ?? null,
    products: draft.products,
    name: draft.name,
    quote: draft.quote,
    consent: draft.consent,
    email: draft.email?.status ?? null,
    missing: missingFacts(draft),
    photoAttemptsLeft: photoAttemptsLeft(draft),
    submitted: draft.submittedAt !== null,
  }
}

/** The findings written onto the submission, or `null` while the draft is incomplete. */
export function findingsOf(draft: Draft, model: string): Findings | null {
  const { analysis, product, textCheck } = draft
  if (!analysis || !product || !textCheck || missingFacts(draft).length > 0) return null
  return {
    qualityScore: analysis.quality.score,
    qualityIssues: analysis.quality.issues,
    markVisible: analysis.markVisible,
    candidates: analysis.candidates,
    productSource: product.source,
    textCheck,
    model,
  }
}
