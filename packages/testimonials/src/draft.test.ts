import { describe, expect, it } from 'vitest'
import { CODE_MAX_ATTEMPTS, MAX_PHOTO_ATTEMPTS } from './constants.ts'
import {
  applyToolResult,
  draftView,
  emptyDraft,
  findingsOf,
  missingFacts,
  photoVerdict,
  type Draft,
  type DraftEvent,
} from './draft.ts'
import type { PhotoAnalysis } from './schemas.ts'

const analysis = (overrides: Partial<PhotoAnalysis> = {}): PhotoAnalysis => ({
  quality: { score: 0.9, issues: [] },
  safety: { ok: true, reason: null },
  markVisible: true,
  candidates: [
    { id: 'mug', confidence: 0.9 },
    { id: 'tumbler', confidence: 0.85 },
    { id: 'bottle', confidence: 0.3 },
  ],
  altText: 'A black mug on a desk',
  ...overrides,
})

const apply = (draft: Draft, ...events: DraftEvent[]) => events.reduce(applyToolResult, draft)

const photo = (attempt = 1): DraftEvent => ({ tool: 'askPhoto', output: { pathname: `testimonials/run/${attempt}.jpg` } })
const allOk: DraftEvent = { tool: 'checkText', output: { nameOk: true, quoteOk: true, altTextOk: true } }

/** A draft with every fact but the verified email. */
const almost = () =>
  apply(
    emptyDraft(),
    photo(),
    { tool: 'analysePhoto', output: analysis() },
    { tool: 'confirmProduct', output: { productId: 'mug', others: [] } },
    { tool: 'askName', output: { name: 'Ada' } },
    { tool: 'reviewQuote', output: { quote: 'Keeps my coffee warm. ' } },
    allOk,
    { tool: 'askConsent', output: { consent: true } },
    { tool: 'askEmail', output: { provided: true }, email: 'ada@example.com' },
    { tool: 'sendCode', output: { codeHash: 'h', expiresAt: '2026-09-27T12:10:00.000Z' } },
  )

describe('photoVerdict', () => {
  it('passes a sharp, safe photo with the mark and a match', () => {
    expect(photoVerdict(analysis())).toBe('ok')
  })

  it('names the most serious problem first', () => {
    expect(photoVerdict(analysis({ safety: { ok: false, reason: 'nudity' }, markVisible: false }))).toBe('unsafe')
    expect(photoVerdict(analysis({ quality: { score: 0.2, issues: ['blurred'] }, markVisible: false }))).toBe('unusable')
    expect(photoVerdict(analysis({ quality: { score: 0.9, issues: ['no-item'] } }))).toBe('unusable')
  })

  it('never matches without the mark, however confident the model is', () => {
    expect(photoVerdict(analysis({ markVisible: false }))).toBe('no-mark')
  })

  it('reports no match when every candidate is below the bar', () => {
    expect(photoVerdict(analysis({ candidates: [{ id: 'mug', confidence: 0.79 }] }))).toBe('no-match')
  })
})

describe('applyToolResult', () => {
  it('counts every upload and stops at the cap', () => {
    const events = Array.from({ length: MAX_PHOTO_ATTEMPTS + 1 }, (_, i) => photo(i + 1))
    const draft = apply(emptyDraft(), ...events)
    expect(draft.attempts).toBe(MAX_PHOTO_ATTEMPTS)
    expect(draft.photo?.pathname).toBe(`testimonials/run/${MAX_PHOTO_ATTEMPTS}.jpg`)
  })

  it('forgets the analysis, the product and the consent when a new photo arrives', () => {
    const draft = apply(almost(), photo(2))
    expect(draft).toMatchObject({ analysis: null, product: null, products: [], altText: null, consent: false })
    expect(draft.name).toBe('Ada')
  })

  it('ignores an analysis or a product before any photo', () => {
    const draft = apply(
      emptyDraft(),
      { tool: 'analysePhoto', output: analysis() },
      { tool: 'confirmProduct', output: { productId: 'mug', others: [] } },
    )
    expect(draft).toEqual(emptyDraft())
  })

  it('records who named the product', () => {
    const base = apply(emptyDraft(), photo(), { tool: 'analysePhoto', output: analysis() })
    expect(apply(base, { tool: 'confirmProduct', output: { productId: 'tumbler', others: [] } }).product).toEqual({
      id: 'tumbler',
      source: 'agent',
    })
    expect(apply(base, { tool: 'confirmProduct', output: { productId: 'bottle', others: [] } }).product).toEqual({
      id: 'bottle',
      source: 'visitor',
    })
  })

  it('treats a candidate as the visitor’s pick when the mark was not visible', () => {
    const base = apply(emptyDraft(), photo(), { tool: 'analysePhoto', output: analysis({ markVisible: false }) })
    expect(apply(base, { tool: 'confirmProduct', output: { productId: 'mug', others: [] } }).product?.source).toBe('visitor')
  })

  it('puts the confirmed product first and drops repeats', () => {
    const base = apply(emptyDraft(), photo(), { tool: 'analysePhoto', output: analysis() })
    const draft = apply(base, { tool: 'confirmProduct', output: { productId: 'mug', others: ['tumbler', 'mug'] } })
    expect(draft.products).toEqual(['mug', 'tumbler'])
  })

  it('keeps the quote exactly as approved', () => {
    expect(almost().quote).toBe('Keeps my coffee warm. ')
  })

  it('clears what the text check refuses', () => {
    const draft = apply(almost(), { tool: 'checkText', output: { nameOk: false, quoteOk: true, altTextOk: false } })
    expect(draft).toMatchObject({ name: null, quote: 'Keeps my coffee warm. ', altText: null })
    expect(missingFacts(draft)).toContain('name')
  })

  it('needs a new check after the name or the quote changes', () => {
    const draft = apply(almost(), { tool: 'askName', output: { name: 'Grace' } })
    expect(draft.textCheck).toBeNull()
    expect(missingFacts(draft)).toEqual(['name', 'quote', 'email'])
  })

  it('verifies the email with the right code', () => {
    const draft = apply(almost(), { tool: 'verifyCode', output: { verified: true } })
    expect(draft.email).toEqual({ address: 'ada@example.com', status: 'verified' })
    expect(missingFacts(draft)).toEqual([])
  })

  it('spends the code after the last wrong try', () => {
    const wrong: DraftEvent = { tool: 'verifyCode', output: { verified: false } }
    const once = apply(almost(), wrong)
    expect(once.email).toMatchObject({ status: 'code-sent', attemptsLeft: CODE_MAX_ATTEMPTS - 1 })
    const spent = apply(almost(), ...Array.from({ length: CODE_MAX_ATTEMPTS }, () => wrong))
    expect(spent.email).toEqual({ address: 'ada@example.com', status: 'provided' })
    expect(apply(spent, { tool: 'verifyCode', output: { verified: true } }).email?.status).toBe('provided')
  })

  it('submits only a complete draft, and a submitted draft never changes', () => {
    const at = '2026-09-27T12:00:00.000Z'
    expect(apply(almost(), { tool: 'submit', output: { submittedAt: at } }).submittedAt).toBeNull()
    const submitted = apply(almost(), { tool: 'verifyCode', output: { verified: true } }, { tool: 'submit', output: { submittedAt: at } })
    expect(submitted.submittedAt).toBe(at)
    expect(apply(submitted, { tool: 'askName', output: { name: 'Mallory' } })).toBe(submitted)
  })
})

describe('missingFacts', () => {
  it('lists everything for an empty draft', () => {
    expect(missingFacts(emptyDraft())).toEqual(['photo', 'product', 'name', 'quote', 'consent', 'email'])
  })

  it('counts a photo without a match, since the visitor can pick the product', () => {
    const draft = apply(emptyDraft(), photo(), { tool: 'analysePhoto', output: analysis({ markVisible: false }) })
    expect(missingFacts(draft)).not.toContain('photo')
  })

  it('never counts an unsafe or unusable photo', () => {
    const unsafe = apply(emptyDraft(), photo(), { tool: 'analysePhoto', output: analysis({ safety: { ok: false, reason: 'x' } }) })
    expect(missingFacts(unsafe)).toContain('photo')
  })
})

describe('draftView', () => {
  it('shows the card no address and no code hash', () => {
    const view = draftView(almost())
    expect(JSON.stringify(view)).not.toContain('ada@example.com')
    expect(view).toMatchObject({ product: 'mug', email: 'code-sent', missing: ['email'], submitted: false })
  })
})

describe('findingsOf', () => {
  it('is null until the draft is complete', () => {
    expect(findingsOf(almost(), 'm')).toBeNull()
  })

  it('carries the analysis, the source and the check', () => {
    const draft = apply(almost(), { tool: 'verifyCode', output: { verified: true } })
    expect(findingsOf(draft, 'google/gemini-2.5-flash')).toEqual({
      qualityScore: 0.9,
      qualityIssues: [],
      markVisible: true,
      candidates: analysis().candidates,
      productSource: 'agent',
      textCheck: { nameOk: true, quoteOk: true, altTextOk: true },
      model: 'google/gemini-2.5-flash',
    })
  })
})
