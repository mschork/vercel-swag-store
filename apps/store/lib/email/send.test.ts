import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from './send'

afterEach(() => vi.restoreAllMocks())

describe('sendEmail', () => {
  it('logs the message without the address', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    await sendEmail('ada@example.com', { subject: 'Code', html: '<p>123456</p>', text: '123456' })
    const logged = log.mock.calls.flat().join(' ')
    expect(logged).toContain('123456')
    expect(logged).not.toContain('ada@example.com')
  })
})
