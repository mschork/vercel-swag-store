import { describe, expect, it } from 'vitest'
import { MAX_BODY_BYTES, readChatBody, turnOf, type ChatBody } from './turn-input'

const user = (text: string) => ({ id: 'u', role: 'user' as const, parts: [{ type: 'text', text }] })
const assistant = (...parts: ({ type: string } & Record<string, unknown>)[]) => ({ id: 'a', role: 'assistant' as const, parts })
const tool = (name: string, output: unknown, state = 'output-available') => ({
  type: `tool-${name}`,
  toolCallId: `call-${name}`,
  state,
  input: {},
  output,
})

describe('turnOf', () => {
  it('reads a typed message', () => {
    expect(turnOf({ messages: [user('  Hello  ')] })).toEqual({ kind: 'message', text: 'Hello' })
    expect(turnOf({ messages: [user(' ')] })).toBeNull()
    expect(turnOf({ messages: [user('x'.repeat(5000))] })).toBeNull()
  })

  it("reads a greeting photo of this run only", () => {
    const body: ChatBody = { messages: [user('Here is my photo.')], photo: 'testimonials/wrun_1/1.jpg' }
    expect(turnOf(body, 'wrun_1')).toEqual({ kind: 'photo', pathname: 'testimonials/wrun_1/1.jpg' })
    expect(turnOf(body, 'wrun_2')).toBeNull()
    expect(turnOf(body)).toBeNull()
  })

  it('reads widget answers with the address and the code beside them', () => {
    const body: ChatBody = {
      messages: [
        assistant(
          { type: 'text', text: 'Hi' },
          tool('askEmail', { provided: true }),
          tool('askCode', { entered: true }),
          tool('askName', null, 'input-available'),
          tool('analysePhoto', { verdict: 'ok' }),
          tool('askConsent', { consent: 'yes' }),
        ),
      ],
      email: 'ada@example.com',
      code: '123456',
    }
    expect(turnOf(body, 'wrun_1')).toEqual({
      kind: 'tools',
      answers: [
        { toolCallId: 'call-askEmail', toolName: 'askEmail', output: { provided: true } },
        { toolCallId: 'call-askCode', toolName: 'askCode', output: { entered: true } },
      ],
      email: 'ada@example.com',
      code: '123456',
    })
  })

  it('drops a malformed address or code and answers null without answers or a run', () => {
    const body: ChatBody = { messages: [assistant(tool('askEmail', { provided: true }))], email: 'nope', code: '12' }
    expect(turnOf(body, 'wrun_1')).toEqual({
      kind: 'tools',
      answers: [{ toolCallId: 'call-askEmail', toolName: 'askEmail', output: { provided: true } }],
    })
    expect(turnOf(body)).toBeNull()
    expect(turnOf({ messages: [assistant({ type: 'text', text: 'Hi' })] }, 'wrun_1')).toBeNull()
  })
})

describe('readChatBody', () => {
  const request = (body: string) => new Request('https://store.test/api', { method: 'POST', body })

  it('parses a body of messages', async () => {
    expect(await readChatBody(request(JSON.stringify({ messages: [user('Hi')] })))).toMatchObject({ messages: [user('Hi')] })
  })

  it('refuses malformed JSON, a wrong shape and an oversized body', async () => {
    expect(await readChatBody(request('{'))).toBeNull()
    expect(await readChatBody(request(JSON.stringify({ messages: [] })))).toBeNull()
    expect(await readChatBody(request(JSON.stringify({ messages: [user('x'.repeat(MAX_BODY_BYTES))] })))).toBeNull()
  })
})
