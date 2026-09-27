import { CODE_RESEND_SECONDS, CODE_TTL_MINUTES } from '@repo/testimonials/constants'
import { emptyDraft, type Draft } from '@repo/testimonials/draft'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: { id: 'client' } as object | null,
  analysePhoto: vi.fn(),
  checkText: vi.fn(),
  writeSubmission: vi.fn(async () => 'testimonialSubmission.wrun_1'),
  sendEmail: vi.fn(async () => {}),
  readPhoto: vi.fn(async () => new Uint8Array([1])),
  deletePhotos: vi.fn(async () => {}),
}))

vi.mock('@repo/testimonials/analyse', () => ({ analysePhoto: mocks.analysePhoto, checkText: mocks.checkText }))
vi.mock('@repo/testimonials', () => ({ writeSubmission: mocks.writeSubmission }))
vi.mock('@/lib/api/products', () => ({
  getAllProducts: async () => [
    { id: 'mug', name: 'Black Mug', slug: 'mug', category: 'drinkware', description: 'A mug', price: 1 },
  ],
}))
vi.mock('@/lib/email/send', () => ({ sendEmail: mocks.sendEmail }))
vi.mock('@/lib/sanity/write-client', () => ({ getWriteClient: () => mocks.client }))
vi.mock('./blob', () => ({ readPhoto: mocks.readPhoto, deletePhotos: mocks.deletePhotos }))
vi.mock('./photo-link', () => ({ photoUrl: (runId: string) => `https://store.test/photo/${runId}?sig=s` }))

const steps = await import('./steps')
const { hashCode } = await import('./code')

const NOW = Date.parse('2026-09-27T10:00:00.000Z')
const provided: Draft['email'] = { address: 'ada@example.com', status: 'provided' }

beforeEach(() => {
  mocks.client = { id: 'client' }
  for (const mock of [mocks.analysePhoto, mocks.checkText, mocks.writeSubmission, mocks.sendEmail, mocks.readPhoto, mocks.deletePhotos]) {
    mock.mockClear()
  }
})

describe('catalogue', () => {
  it('keeps what the analysis reads', async () => {
    expect(await steps.catalogue()).toEqual([{ id: 'mug', name: 'Black Mug', category: 'drinkware', description: 'A mug' }])
  })
})

describe('analyse', () => {
  it('reads the photo and drops candidates outside the catalogue', async () => {
    mocks.analysePhoto.mockResolvedValue({
      candidates: [
        { id: 'mug', confidence: 0.9 },
        { id: 'invented', confidence: 0.9 },
      ],
    })
    const products = await steps.catalogue()
    const analysis = await steps.analyse('testimonials/wrun_1/1.jpg', products)
    expect(mocks.readPhoto).toHaveBeenCalledWith('testimonials/wrun_1/1.jpg')
    expect(analysis.candidates).toEqual([{ id: 'mug', confidence: 0.9 }])
  })
})

describe('screen', () => {
  it('checks empty strings for missing texts', async () => {
    mocks.checkText.mockResolvedValue({ nameOk: true, quoteOk: true, altTextOk: true })
    await steps.screen({ name: 'Ada', quote: null, altText: null })
    expect(mocks.checkText).toHaveBeenCalledWith({ name: 'Ada', quote: '', altText: '' })
  })
})

describe('sendCode', () => {
  it('emails a code and answers only its hash and expiry', async () => {
    const sent = await steps.sendCode('wrun_1', provided, NOW)
    expect(sent).toEqual({ codeHash: expect.any(String), expiresAt: new Date(NOW + CODE_TTL_MINUTES * 60_000).toISOString() })
    const [to, email] = mocks.sendEmail.mock.calls[0] as unknown as [string, { text: string }]
    expect(to).toBe('ada@example.com')
    const code = /\d{6}/.exec(email.text)?.[0] as string
    expect('codeHash' in sent && sent.codeHash).toBe(hashCode('wrun_1', code))
  })

  it('asks to wait until a new code may go', async () => {
    const expiresAt = new Date(NOW + CODE_TTL_MINUTES * 60_000).toISOString()
    const codeSent: Draft['email'] = { address: 'a@b.co', status: 'code-sent', codeHash: 'h', expiresAt, attemptsLeft: 5 }
    expect(await steps.sendCode('wrun_1', codeSent, NOW + 10_000)).toEqual({ waitSeconds: CODE_RESEND_SECONDS - 10 })
    expect(await steps.sendCode('wrun_1', codeSent, NOW + CODE_RESEND_SECONDS * 1000)).toHaveProperty('codeHash')
  })

  it('throws without an address', async () => {
    await expect(steps.sendCode('wrun_1', null)).rejects.toThrow('no email address')
  })
})

describe('verifyCode', () => {
  const email = (expiresAt: string): Draft['email'] => ({
    address: 'a@b.co',
    status: 'code-sent',
    codeHash: hashCode('wrun_1', '123456'),
    expiresAt,
    attemptsLeft: 5,
  })

  it('accepts the code before it expires', () => {
    const later = new Date(NOW + 60_000).toISOString()
    expect(steps.verifyCode('wrun_1', email(later), '123456', NOW)).toEqual({ verified: true })
    expect(steps.verifyCode('wrun_1', email(later), '654321', NOW)).toEqual({ verified: false })
  })

  it('refuses an expired code and one never sent', () => {
    expect(steps.verifyCode('wrun_1', email(new Date(NOW).toISOString()), '123456', NOW)).toEqual({ verified: false })
    expect(steps.verifyCode('wrun_1', provided, '123456', NOW)).toEqual({ verified: false })
  })
})

describe('submit', () => {
  it('writes the submission with the signed photo link', async () => {
    const now = new Date(NOW)
    const draft = emptyDraft()
    expect(await steps.submit('wrun_1', draft, now)).toEqual({ submittedAt: now.toISOString() })
    expect(mocks.writeSubmission).toHaveBeenCalledWith(mocks.client, {
      runId: 'wrun_1',
      draft,
      photoUrl: 'https://store.test/photo/wrun_1?sig=s',
      model: 'google/gemini-2.5-flash',
      now,
    })
  })

  it('throws without a write token', async () => {
    mocks.client = null
    await expect(steps.submit('wrun_1', emptyDraft())).rejects.toThrow('SANITY_API_WRITE_TOKEN')
  })
})

describe('dropPhotos', () => {
  it("deletes the run's photos", async () => {
    await steps.dropPhotos('wrun_1', 'keep')
    expect(mocks.deletePhotos).toHaveBeenCalledWith('wrun_1', 'keep')
  })
})
