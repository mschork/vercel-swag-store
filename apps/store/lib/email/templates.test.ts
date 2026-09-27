import { describe, expect, it } from 'vitest'
import { codeEmail } from './templates'

describe('codeEmail', () => {
  it('carries the code in the subject, the HTML and the text part', () => {
    const email = codeEmail('042917')
    expect(email.subject).toContain('042917')
    expect(email.html).toContain('042917')
    expect(email.text).toContain('042917')
  })
})
