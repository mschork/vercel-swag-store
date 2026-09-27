import { describe, expect, it } from 'vitest'
import { applyToolResult, emptyDraft, type Draft, type DraftEvent } from './draft.ts'
import { closeSubmission, publishTestimonial, writeSubmission, type TestimonialsClient } from './store.ts'

const NOW = new Date('2026-09-27T12:00:00.000Z')

/** Records every write; implements only the calls store.ts makes. */
function fakeClient() {
  const created: Record<string, unknown>[] = []
  const patches: { id: string; set?: unknown; unset?: string[] }[] = []
  const uploads: { body: unknown; options: unknown }[] = []
  const client = {
    createIfNotExists: async (doc: Record<string, unknown>) => {
      created.push(doc)
      return doc
    },
    patch: (id: string) => {
      const record: (typeof patches)[number] = { id }
      const patch = {
        set: (values: unknown) => ((record.set = values), patch),
        unset: (keys: string[]) => ((record.unset = keys), patch),
        commit: async () => {
          patches.push(record)
        },
      }
      return patch
    },
    assets: {
      upload: async (_type: string, body: unknown, options: unknown) => {
        uploads.push({ body, options })
        return { _id: 'image-abc-800x600-jpg' }
      },
    },
  }
  return { client: client as unknown as TestimonialsClient, created, patches, uploads }
}

const complete = (): Draft =>
  (
    [
      { tool: 'askPhoto', output: { pathname: 'testimonials/run1/1.jpg' } },
      {
        tool: 'analysePhoto',
        output: {
          quality: { score: 0.9, issues: [] },
          safety: { ok: true, reason: null },
          markVisible: true,
          candidates: [{ id: 'mug', confidence: 0.9 }],
          altText: 'A black mug',
        },
      },
      { tool: 'confirmProduct', output: { productId: 'mug', others: ['pen'] } },
      { tool: 'askName', output: { name: 'Ada' } },
      { tool: 'reviewQuote', output: { quote: 'Warm coffee.' } },
      { tool: 'checkText', output: { nameOk: true, quoteOk: true, altTextOk: true } },
      { tool: 'askConsent', output: { consent: true } },
      { tool: 'askEmail', output: { provided: true }, email: 'ada@example.com' },
      { tool: 'sendCode', output: { codeHash: 'h', expiresAt: NOW.toISOString() } },
      { tool: 'verifyCode', output: { verified: true } },
    ] satisfies DraftEvent[]
  ).reduce(applyToolResult, emptyDraft())

describe('writeSubmission', () => {
  it('writes a private, pending submission from the draft', async () => {
    const { client, created } = fakeClient()
    const id = await writeSubmission(client, { runId: 'run1', draft: complete(), photoUrl: 'https://s/p', model: 'm', now: NOW })
    expect(id).toBe('testimonialSubmission.run1')
    expect(created).toEqual([
      {
        _id: 'testimonialSubmission.run1',
        _type: 'testimonialSubmission',
        person: 'Ada',
        quote: 'Warm coffee.',
        products: [
          { _type: 'reference', _key: 'mug', _ref: 'product-mug', _weak: true },
          { _type: 'reference', _key: 'pen', _ref: 'product-pen', _weak: true },
        ],
        productSource: 'agent',
        email: 'ada@example.com',
        photoUrl: 'https://s/p',
        photoAlt: 'A black mug',
        findings: {
          qualityScore: 0.9,
          qualityIssues: [],
          markVisible: true,
          candidates: [{ _key: 'mug', id: 'mug', confidence: 0.9 }],
          productSource: 'agent',
          textCheck: { nameOk: true, quoteOk: true, altTextOk: true },
          model: 'm',
        },
        consentGiven: true,
        submittedAt: NOW.toISOString(),
        runId: 'run1',
        status: 'pending',
      },
    ])
  })

  it('leaves out an alt text the check refused', async () => {
    const { client, created } = fakeClient()
    const draft = applyToolResult(complete(), { tool: 'checkText', output: { nameOk: true, quoteOk: true, altTextOk: false } })
    await writeSubmission(client, { runId: 'run1', draft, photoUrl: 'u', model: 'm' })
    expect(created[0]).not.toHaveProperty('photoAlt')
  })

  it('refuses an incomplete draft', async () => {
    const { client, created } = fakeClient()
    const draft = applyToolResult(complete(), { tool: 'askConsent', output: { consent: false } })
    await expect(writeSubmission(client, { runId: 'run1', draft, photoUrl: 'u', model: 'm' })).rejects.toThrow('not complete')
    expect(created).toEqual([])
  })
})

describe('publishTestimonial', () => {
  it('uploads the photo and publishes a testimonial with consent', async () => {
    const { client, created, uploads } = fakeClient()
    const photo = Buffer.from('jpeg')
    const id = await publishTestimonial(client, {
      runId: 'run1',
      person: 'Ada',
      quote: 'Warm coffee.',
      products: ['mug'],
      photo,
      photoAlt: 'A black mug',
      now: NOW,
    })
    expect(id).toBe('testimonial-run1')
    expect(uploads).toEqual([{ body: photo, options: { filename: 'run1.jpg', contentType: 'image/jpeg' } }])
    expect(created).toEqual([
      {
        _id: 'testimonial-run1',
        _type: 'testimonial',
        person: 'Ada',
        photo: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-800x600-jpg' }, alt: 'A black mug' },
        quote: 'Warm coffee.',
        products: [{ _type: 'reference', _key: 'mug', _ref: 'product-mug' }],
        consent: true,
        publishedAt: NOW.toISOString(),
        submission: { _type: 'reference', _ref: 'testimonialSubmission.run1', _weak: true },
      },
    ])
  })
})

describe('closeSubmission', () => {
  it('removes the address and the photo link and stamps the date', async () => {
    const { client, patches } = fakeClient()
    await closeSubmission(client, 'run1', NOW)
    expect(patches).toEqual([
      { id: 'testimonialSubmission.run1', set: { decidedAt: NOW.toISOString() }, unset: ['email', 'photoUrl'] },
    ])
  })
})
