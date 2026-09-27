import { MAX_PHOTO_ATTEMPTS } from '@repo/testimonials/constants'
import { emptyDraft, type Draft } from '@repo/testimonials/draft'
import type { PhotoAnalysis } from '@repo/testimonials/schemas'
import { describe, expect, it, vi } from 'vitest'
import {
  PHOTO_MESSAGE,
  TYPED_INSTEAD,
  conversationOver,
  receiveAnswer,
  receiveTurn,
  runServerTool,
  toolMessage,
  type Conversation,
  type ServerSteps,
  type TurnContext,
} from './turn'

const context: TurnContext = {
  runId: 'wrun_1',
  products: [
    { id: 'mug', name: 'Black Mug' },
    { id: 'tumbler', name: 'Tumbler' },
  ],
}
const photo = (attempt: number) => `testimonials/wrun_1/${attempt}.jpg`
const start = (draft: Partial<Draft> = {}): Conversation => ({ draft: { ...emptyDraft(), ...draft }, code: null })

const analysis = (overrides: Partial<PhotoAnalysis> = {}): PhotoAnalysis => ({
  quality: { score: 0.9, issues: [] },
  safety: { ok: true, reason: null },
  markVisible: true,
  candidates: [{ id: 'mug', confidence: 0.9 }],
  altText: 'A black mug',
  ...overrides,
})

const steps = (overrides: Partial<ServerSteps> = {}): ServerSteps => ({
  analyse: vi.fn(async () => analysis()),
  screen: vi.fn(async () => ({ nameOk: true, quoteOk: true, altTextOk: true })),
  sendCode: vi.fn(async () => ({ codeHash: 'hash', expiresAt: '2026-09-27T10:10:00.000Z' })),
  verifyCode: vi.fn(async () => ({ verified: true })),
  submit: vi.fn(async () => ({ submittedAt: '2026-09-27T10:00:00.000Z' })),
  ...overrides,
})

describe('receiveAnswer', () => {
  it('takes a photo of this run and names the one it replaces', () => {
    const first = receiveAnswer(start(), { toolCallId: 'c1', toolName: 'askPhoto', output: { pathname: photo(1) } }, {}, context)
    expect(first.output).toEqual({ uploaded: true, attemptsLeft: MAX_PHOTO_ATTEMPTS - 1 })
    expect(first.superseded).toBeUndefined()
    const second = receiveAnswer(first.conversation, { toolCallId: 'c2', toolName: 'askPhoto', output: { pathname: photo(2) } }, {}, context)
    expect(second.superseded).toBe(photo(1))
    expect(second.conversation.draft.photo).toEqual({ pathname: photo(2) })
  })

  it("refuses another run's photo and one past the attempts", () => {
    const foreign = receiveAnswer(start(), { toolCallId: 'c1', toolName: 'askPhoto', output: { pathname: 'testimonials/wrun_2/1.jpg' } }, {}, context)
    expect(foreign.output).toMatchObject({ uploaded: false })
    const spent = receiveAnswer(start({ attempts: MAX_PHOTO_ATTEMPTS }), { toolCallId: 'c1', toolName: 'askPhoto', output: { pathname: photo(3) } }, {}, context)
    expect(spent.output).toEqual({ uploaded: false, attemptsLeft: 0 })
  })

  it('confirms only a catalogue product and tells the model its name', () => {
    const base = start({ photo: { pathname: photo(1) }, analysis: analysis() })
    const unknown = receiveAnswer(base, { toolCallId: 'c', toolName: 'confirmProduct', output: { productId: 'nope', others: [] } }, {}, context)
    expect(unknown.output).toEqual({ confirmed: false })
    const known = receiveAnswer(base, { toolCallId: 'c', toolName: 'confirmProduct', output: { productId: 'mug', others: ['tumbler', 'nope'] } }, {}, context)
    expect(known.output).toEqual({ confirmed: 'Black Mug', others: ['Tumbler'] })
    expect(known.conversation.draft.product).toEqual({ id: 'mug', source: 'agent' })
    expect(known.conversation.draft.products).toEqual(['mug', 'tumbler'])
  })

  it('passes the name, the quote and consent through', () => {
    expect(receiveAnswer(start(), { toolCallId: 'c', toolName: 'askName', output: { name: 'Ada' } }, {}, context).conversation.draft.name).toBe('Ada')
    expect(receiveAnswer(start(), { toolCallId: 'c', toolName: 'reviewQuote', output: { quote: ' Great mug ' } }, {}, context).conversation.draft.quote).toBe(' Great mug ')
    expect(receiveAnswer(start(), { toolCallId: 'c', toolName: 'askConsent', output: { consent: true } }, {}, context).conversation.draft.consent).toBe(true)
  })

  it('keeps the address out of what the model is told', () => {
    const given = receiveAnswer(start(), { toolCallId: 'c', toolName: 'askEmail', output: { provided: true } }, { email: 'ada@example.com' }, context)
    expect(given.output).toEqual({ provided: true })
    expect(given.conversation.draft.email).toEqual({ address: 'ada@example.com', status: 'provided' })
    const missing = receiveAnswer(start(), { toolCallId: 'c', toolName: 'askEmail', output: { provided: true } }, {}, context)
    expect(missing.output).toEqual({ provided: false })
  })

  it('keeps the entered code for verifyCode and out of what the model is told', () => {
    const entered = receiveAnswer(start(), { toolCallId: 'c', toolName: 'askCode', output: { entered: true } }, { code: '123456' }, context)
    expect(entered).toMatchObject({ output: { entered: true }, conversation: { code: '123456' } })
    const resend = receiveAnswer(start(), { toolCallId: 'c', toolName: 'askCode', output: { resend: true } }, {}, context)
    expect(resend.output).toEqual({ wantsNewCode: true })
    const none = receiveAnswer(start(), { toolCallId: 'c', toolName: 'askCode', output: { entered: true } }, {}, context)
    expect(none.output).toEqual({ entered: false })
  })
})

describe('runServerTool', () => {
  it('analyses the draft photo and reports the verdict with the counting products', async () => {
    const run = await runServerTool('analysePhoto', start({ attempts: 1, photo: { pathname: photo(1) } }), steps(), context)
    expect(run.output).toEqual({ verdict: 'ok', attemptsLeft: MAX_PHOTO_ATTEMPTS - 1, issues: [], products: ['Black Mug'] })
    expect(run.conversation.draft.analysis).not.toBeNull()
  })

  it('asks for a photo when there is none', async () => {
    const fake = steps()
    const run = await runServerTool('analysePhoto', start(), fake, context)
    expect(run.output).toMatchObject({ error: expect.any(String) })
    expect(fake.analyse).not.toHaveBeenCalled()
  })

  it('screens the name and the quote but tells the model nothing of the alt text', async () => {
    const fake = steps({ screen: vi.fn(async () => ({ nameOk: true, quoteOk: false, altTextOk: false })) })
    const run = await runServerTool('checkText', start({ name: 'Ada', quote: 'Rude' }), fake, context)
    expect(run.output).toEqual({ nameOk: true, quoteOk: false })
    expect(run.conversation.draft.quote).toBeNull()
    expect((await runServerTool('checkText', start(), fake, context)).output).toMatchObject({ error: expect.any(String) })
  })

  it('sends a code, or says how long to wait', async () => {
    const withEmail = start({ email: { address: 'ada@example.com', status: 'provided' } })
    const sent = await runServerTool('sendCode', withEmail, steps(), context)
    expect(sent.output).toEqual({ sent: true })
    expect(sent.conversation.draft.email).toMatchObject({ status: 'code-sent', codeHash: 'hash' })
    const wait = await runServerTool('sendCode', withEmail, steps({ sendCode: vi.fn(async () => ({ waitSeconds: 12 })) }), context)
    expect(wait.output).toEqual({ sent: false, waitSeconds: 12 })
    expect((await runServerTool('sendCode', start(), steps(), context)).output).toMatchObject({ error: expect.any(String) })
    const verified = start({ email: { address: 'a@b.co', status: 'verified' } })
    expect((await runServerTool('sendCode', verified, steps(), context)).output).toEqual({ email: 'verified' })
  })

  it('verifies the entered code and forgets it either way', async () => {
    const codeSent: Conversation = {
      draft: { ...emptyDraft(), email: { address: 'a@b.co', status: 'code-sent', codeHash: 'h', expiresAt: 'x', attemptsLeft: 2 } },
      code: '123456',
    }
    const ok = await runServerTool('verifyCode', codeSent, steps(), context)
    expect(ok).toMatchObject({ output: { email: 'verified' }, conversation: { code: null } })
    const wrong = await runServerTool('verifyCode', codeSent, steps({ verifyCode: vi.fn(async () => ({ verified: false })) }), context)
    expect(wrong).toMatchObject({ output: { verified: false, triesLeft: 1 }, conversation: { code: null } })
  })

  it('asks for the steps verifyCode needs first', async () => {
    expect((await runServerTool('verifyCode', start(), steps(), context)).output).toMatchObject({ error: expect.any(String) })
    const noCode = start({ email: { address: 'a@b.co', status: 'code-sent', codeHash: 'h', expiresAt: 'x', attemptsLeft: 2 } })
    expect((await runServerTool('verifyCode', noCode, steps(), context)).output).toMatchObject({ error: expect.any(String) })
    const verified = start({ email: { address: 'a@b.co', status: 'verified' } })
    expect((await runServerTool('verifyCode', verified, steps(), context)).output).toEqual({ email: 'verified' })
  })

  it('submits only a complete draft', async () => {
    const fake = steps()
    const incomplete = await runServerTool('submit', start(), fake, context)
    expect(incomplete.output).toMatchObject({ submitted: false, missing: expect.arrayContaining(['photo', 'email']) })
    expect(fake.submit).not.toHaveBeenCalled()

    const complete: Draft = {
      ...emptyDraft(),
      attempts: 1,
      photo: { pathname: photo(1) },
      analysis: analysis(),
      product: { id: 'mug', source: 'agent' },
      products: ['mug'],
      name: 'Ada',
      quote: 'Great',
      textCheck: { nameOk: true, quoteOk: true, altTextOk: true },
      consent: true,
      email: { address: 'a@b.co', status: 'verified' },
    }
    const done = await runServerTool('submit', { draft: complete, code: null }, fake, context)
    expect(done.output).toEqual({ submitted: true })
    expect(done.conversation.draft.submittedAt).toBe('2026-09-27T10:00:00.000Z')
    expect((await runServerTool('submit', done.conversation, fake, context)).output).toEqual({ submitted: true })
    expect(fake.submit).toHaveBeenCalledTimes(1)
  })
})

describe('receiveTurn', () => {
  const pending = [{ toolCallId: 'c1', toolName: 'askName' }]

  it('answers open widgets as typed past when the visitor types', () => {
    const turn = receiveTurn(start(), pending, { kind: 'message', text: 'Hello' }, context)
    expect(turn?.messages).toEqual([
      toolMessage([{ call: pending[0]!, output: TYPED_INSTEAD }]),
      { role: 'user', content: 'Hello' },
    ])
  })

  it('takes a photo from the greeting', () => {
    const turn = receiveTurn(start(), [], { kind: 'photo', pathname: photo(1) }, context)
    expect(turn?.messages).toEqual([{ role: 'user', content: PHOTO_MESSAGE }])
    expect(turn?.conversation.draft.photo).toEqual({ pathname: photo(1) })
    expect(receiveTurn(start(), [], { kind: 'photo', pathname: 'testimonials/wrun_9/1.jpg' }, context)).toBeNull()
  })

  it('applies the answers to open calls and ignores a resend', () => {
    const answers = [{ toolCallId: 'c1', toolName: 'askName' as const, output: { name: 'Ada' } }]
    const turn = receiveTurn(start(), pending, { kind: 'tools', answers }, context)
    expect(turn?.conversation.draft.name).toBe('Ada')
    expect(turn?.messages).toEqual([toolMessage([{ call: pending[0]!, output: { name: 'Ada' } }])])
    expect(receiveTurn(start(), [], { kind: 'tools', answers }, context)).toBeNull()
  })

  it('names superseded photos and answers unmatched calls as typed past', () => {
    const open = [
      { toolCallId: 'c1', toolName: 'askPhoto' },
      { toolCallId: 'c2', toolName: 'askName' },
    ]
    const answers = [{ toolCallId: 'c1', toolName: 'askPhoto' as const, output: { pathname: photo(2) } }]
    const turn = receiveTurn(start({ attempts: 1, photo: { pathname: photo(1) } }), open, { kind: 'tools', answers }, context)
    expect(turn?.superseded).toEqual([photo(1)])
    expect(turn?.messages[0]).toMatchObject({ content: [{ toolCallId: 'c1' }, { toolCallId: 'c2', output: { value: TYPED_INSTEAD } }] })
  })
})

describe('conversationOver', () => {
  it('is over once submitted, or after an unsafe last photo', () => {
    expect(conversationOver(emptyDraft())).toBe(false)
    expect(conversationOver({ ...emptyDraft(), submittedAt: 'now' })).toBe(true)
    const unsafe = analysis({ safety: { ok: false, reason: 'x' } })
    expect(conversationOver({ ...emptyDraft(), attempts: MAX_PHOTO_ATTEMPTS, analysis: unsafe })).toBe(true)
    expect(conversationOver({ ...emptyDraft(), attempts: 1, analysis: unsafe })).toBe(false)
  })
})
