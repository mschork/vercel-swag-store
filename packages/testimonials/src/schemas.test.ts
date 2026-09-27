import { describe, expect, it } from 'vitest'
import {
  CodeSchema,
  DecisionSchema,
  EmailAddressSchema,
  NameSchema,
  PhotoUploadedSchema,
  QuoteSchema,
} from './schemas.ts'

describe('DecisionSchema', () => {
  const base = { _id: 'testimonialSubmission.run1', runId: 'run1' }

  it('accepts an acceptance with alt text', () => {
    expect(DecisionSchema.safeParse({ ...base, status: 'accepted', photoAlt: 'A mug' }).success).toBe(true)
  })

  it('refuses an acceptance without alt text', () => {
    expect(DecisionSchema.safeParse({ ...base, status: 'accepted', photoAlt: ' ' }).success).toBe(false)
  })

  it('needs a known reason for a rejection', () => {
    expect(DecisionSchema.safeParse({ ...base, status: 'rejected', rejectionReason: 'photo' }).success).toBe(true)
    expect(DecisionSchema.safeParse({ ...base, status: 'rejected', rejectionReason: 'rude' }).success).toBe(false)
    expect(DecisionSchema.safeParse({ ...base, status: 'rejected' }).success).toBe(false)
  })

  it('refuses a pending status and any other document', () => {
    expect(DecisionSchema.safeParse({ ...base, status: 'pending' }).success).toBe(false)
    expect(
      DecisionSchema.safeParse({ _id: 'testimonial-run1', runId: 'run1', status: 'rejected', rejectionReason: 'other' }).success,
    ).toBe(false)
  })

  it('refuses a run id that does not match the submission', () => {
    expect(DecisionSchema.safeParse({ ...base, runId: 'run2', status: 'rejected', rejectionReason: 'other' }).success).toBe(false)
  })
})

describe('widget answers', () => {
  it('accepts only pathnames the upload route chooses', () => {
    expect(PhotoUploadedSchema.safeParse({ pathname: 'testimonials/wrun_01AB/1.jpg' }).success).toBe(true)
    expect(PhotoUploadedSchema.safeParse({ pathname: 'testimonials/../other/1.jpg' }).success).toBe(false)
    expect(PhotoUploadedSchema.safeParse({ pathname: 'elsewhere/run/1.jpg' }).success).toBe(false)
  })

  it('trims a name but keeps a quote as typed', () => {
    expect(NameSchema.parse({ name: '  Ada ' }).name).toBe('Ada')
    expect(QuoteSchema.parse({ quote: ' Great mug ' }).quote).toBe(' Great mug ')
  })

  it('refuses an empty or overlong quote', () => {
    expect(QuoteSchema.safeParse({ quote: '   ' }).success).toBe(false)
    expect(QuoteSchema.safeParse({ quote: 'x'.repeat(241) }).success).toBe(false)
    expect(QuoteSchema.safeParse({ quote: 'x'.repeat(240) }).success).toBe(true)
  })

  it('checks the code and the address', () => {
    expect(CodeSchema.safeParse({ code: '012345' }).success).toBe(true)
    expect(CodeSchema.safeParse({ code: '12345' }).success).toBe(false)
    expect(EmailAddressSchema.safeParse('ada@example.com').success).toBe(true)
    expect(EmailAddressSchema.safeParse('ada').success).toBe(false)
  })
})
