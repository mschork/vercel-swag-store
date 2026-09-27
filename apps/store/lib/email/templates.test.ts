import { REJECTION_REASONS } from '@repo/testimonials/constants'
import { describe, expect, it } from 'vitest'
import { approvalEmail, codeEmail, rejectionEmail } from './templates'

describe('codeEmail', () => {
  it('carries the code in the subject, the HTML and the text part', () => {
    const email = codeEmail('042917')
    expect(email.subject).toContain('042917')
    expect(email.html).toContain('042917')
    expect(email.text).toContain('042917')
  })
})

describe('approvalEmail', () => {
  const product = { name: 'Black Bucket Hat', url: 'https://store.example/products/bucket-hat' }

  it('says the testimonial is live and links the product page', () => {
    const email = approvalEmail(product)
    expect(email.subject).toBe('Your testimonial is live')
    expect(email.html).toContain('href="https://store.example/products/bucket-hat"')
    expect(email.text).toContain('Black Bucket Hat')
    expect(email.text).toContain('https://store.example/products/bucket-hat')
  })

  it('escapes the product name in the HTML part', () => {
    const email = approvalEmail({ ...product, name: 'Mug <b>& "Co"</b>' })
    expect(email.html).toContain('Mug &lt;b&gt;&amp; &quot;Co&quot;&lt;/b&gt;')
    expect(email.html).not.toContain('<b>')
  })
})

describe('rejectionEmail', () => {
  it('names one sentence for every reason and invites the visitor back', () => {
    const texts = REJECTION_REASONS.map((reason) => rejectionEmail(reason, 'https://store.example/testimonials#share').text)
    expect(new Set(texts).size).toBe(REJECTION_REASONS.length)
    for (const text of texts) expect(text).toContain('https://store.example/testimonials#share')
  })
})
