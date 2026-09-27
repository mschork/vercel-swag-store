import type { ModelMessage } from 'ai'
import type { z } from 'zod'
import { CLIENT_TOOLS, SERVER_TOOLS, type ClientTool, type ServerTool } from '@repo/testimonials/constants'
import {
  applyToolResult,
  countingCandidates,
  missingFacts,
  photoAttemptsLeft,
  photoVerdict,
  type Draft,
} from '@repo/testimonials/draft'
import type { PromptProduct } from '@repo/testimonials/prompt'
import { runIdOfPathname, type CLIENT_TOOL_OUTPUTS, type PhotoAnalysis, type TextCheck } from '@repo/testimonials/schemas'

/**
 * One turn of a testimonial conversation, without the workflow runtime: what
 * the visitor sent, how each widget answer and each server tool changes the
 * draft, and what the model is told. The model sees only what these
 * functions return, never an address, a code or a hash. The workflow body
 * imports this module, so it stays free of Node built-ins.
 */

/** A widget answer as the message route parsed it. */
export type ClientAnswer = {
  [T in ClientTool]: {
    toolCallId: string
    toolName: T
    output: z.infer<(typeof CLIENT_TOOL_OUTPUTS)[T]>
  }
}[ClientTool]

/** What the message route delivers to the run's turn hook. */
export type TurnInput =
  | { kind: 'message'; text: string }
  /** The name entered in the greeting, which starts the run. */
  | { kind: 'name'; name: string }
  | { kind: 'tools'; answers: ClientAnswer[]; email?: string; code?: string }

export interface ToolCallRef {
  toolCallId: string
  toolName: string
}

/** The run's state between turns. `code` is the one the visitor entered, until `verifyCode` reads it. */
export interface Conversation {
  draft: Draft
  code: string | null
}

export const isClientTool = (name: string): name is ClientTool => (CLIENT_TOOLS as readonly string[]).includes(name)
export const isServerTool = (name: string): name is ServerTool => (SERVER_TOOLS as readonly string[]).includes(name)

/** What the run needs besides the conversation: its id and the catalogue. */
export interface TurnContext {
  runId: string
  products: readonly Pick<PromptProduct, 'id' | 'name'>[]
}

const nameOf = (context: TurnContext, id: string) =>
  context.products.find((product) => product.id === id)?.name ?? null

export interface Received {
  conversation: Conversation
  output: unknown
  /** A photo the answer replaced, which the run deletes. */
  superseded?: string
}

/** Applies one widget answer and answers what the model is told about it. */
export function receiveAnswer(
  { draft, code }: Conversation,
  answer: ClientAnswer,
  extras: { email?: string; code?: string },
  context: TurnContext,
): Received {
  const conversation = (next: Draft, nextCode = code): Conversation => ({ draft: next, code: nextCode })
  switch (answer.toolName) {
    case 'askPhoto':
      return receivePhoto({ draft, code }, answer.output.pathname, context)
    case 'confirmProduct': {
      const { productId } = answer.output
      if (!nameOf(context, productId)) return { conversation: conversation(draft), output: { confirmed: false } }
      const others = answer.output.others.filter((id) => id !== productId && nameOf(context, id))
      const next = applyToolResult(draft, { tool: 'confirmProduct', output: { productId, others } })
      return {
        conversation: conversation(next),
        output: { confirmed: nameOf(context, productId), others: others.map((id) => nameOf(context, id)) },
      }
    }
    case 'askName':
      return {
        conversation: conversation(applyToolResult(draft, { tool: 'askName', output: answer.output })),
        output: answer.output,
      }
    case 'reviewQuote':
      return {
        conversation: conversation(applyToolResult(draft, { tool: 'reviewQuote', output: answer.output })),
        output: answer.output,
      }
    case 'askConsent':
      return {
        conversation: conversation(applyToolResult(draft, { tool: 'askConsent', output: answer.output })),
        output: answer.output,
      }
    case 'askEmail': {
      if (!extras.email) return { conversation: conversation(draft), output: { provided: false } }
      const next = applyToolResult(draft, { tool: 'askEmail', output: { provided: true }, email: extras.email })
      return { conversation: conversation(next), output: { provided: true } }
    }
    case 'askCode': {
      if ('resend' in answer.output) return { conversation: conversation(draft, null), output: { wantsNewCode: true } }
      if (!extras.code) return { conversation: conversation(draft, null), output: { entered: false } }
      return { conversation: conversation(draft, extras.code), output: { entered: true } }
    }
  }
}

/** A new photo from `askPhoto`. Only this run's pathnames count. */
export function receivePhoto({ draft, code }: Conversation, pathname: string, context: TurnContext): Received {
  if (runIdOfPathname(pathname) !== context.runId || photoAttemptsLeft(draft) === 0) {
    return { conversation: { draft, code }, output: { uploaded: false, attemptsLeft: photoAttemptsLeft(draft) } }
  }
  const next = applyToolResult(draft, { tool: 'askPhoto', output: { pathname } })
  return {
    conversation: { draft: next, code },
    output: { uploaded: true, attemptsLeft: photoAttemptsLeft(next) },
    ...(draft.photo && draft.photo.pathname !== pathname ? { superseded: draft.photo.pathname } : {}),
  }
}

/**
 * Whether a model call answered nothing: no text and no tool call. The model
 * sometimes does this after a tool result, and the turn would end with
 * nothing for the visitor to answer.
 */
export function emptyAnswer(result: { toolCalls: readonly unknown[]; steps: readonly { text: string }[] }): boolean {
  return result.toolCalls.length === 0 && result.steps.every((step) => step.text.trim() === '')
}

/** The I/O a server tool needs; in the run each is a step. */
export interface ServerSteps {
  analyse(pathname: string): Promise<PhotoAnalysis>
  screen(draft: Draft): Promise<TextCheck>
  sendCode(email: Draft['email']): Promise<{ codeHash: string; expiresAt: string } | { waitSeconds: number }>
  verifyCode(email: Draft['email'], code: string): Promise<{ verified: boolean }>
  submit(draft: Draft): Promise<{ submittedAt: string }>
}

/**
 * Runs one server tool against the draft as it stands, whatever arguments
 * the model passed, and answers what the model is told.
 */
export async function runServerTool(
  name: ServerTool,
  { draft, code }: Conversation,
  steps: ServerSteps,
  context: TurnContext,
): Promise<{ conversation: Conversation; output: unknown }> {
  const done = (next: Draft, output: unknown, nextCode = code) => ({
    conversation: { draft: next, code: nextCode },
    output,
  })
  switch (name) {
    case 'analysePhoto': {
      if (!draft.photo) return done(draft, { error: 'There is no photo yet. Call askPhoto.' })
      const analysis = await steps.analyse(draft.photo.pathname)
      const next = applyToolResult(draft, { tool: 'analysePhoto', output: analysis })
      return done(next, {
        verdict: photoVerdict(analysis),
        attemptsLeft: photoAttemptsLeft(next),
        issues: analysis.quality.issues,
        products: countingCandidates(analysis).map((candidate) => nameOf(context, candidate.id)),
      })
    }
    case 'checkText': {
      if (!draft.name || !draft.quote) return done(draft, { error: 'Ask for the name and the quote first.' })
      const check = await steps.screen(draft)
      return done(applyToolResult(draft, { tool: 'checkText', output: check }), {
        nameOk: check.nameOk,
        quoteOk: check.quoteOk,
      })
    }
    case 'sendCode': {
      if (!draft.email) return done(draft, { error: 'Ask for the email address first.' })
      if (draft.email.status === 'verified') return done(draft, { email: 'verified' })
      const sent = await steps.sendCode(draft.email)
      if ('waitSeconds' in sent) return done(draft, { sent: false, waitSeconds: sent.waitSeconds })
      return done(applyToolResult(draft, { tool: 'sendCode', output: sent }), { sent: true }, null)
    }
    case 'verifyCode': {
      if (draft.email?.status === 'verified') return done(draft, { email: 'verified' }, null)
      if (draft.email?.status !== 'code-sent') return done(draft, { error: 'Call sendCode first.' }, null)
      if (!code) return done(draft, { error: 'Call askCode first.' })
      const result = await steps.verifyCode(draft.email, code)
      const next = applyToolResult(draft, { tool: 'verifyCode', output: result })
      if (next.email?.status === 'verified') return done(next, { email: 'verified' }, null)
      const triesLeft = next.email?.status === 'code-sent' ? next.email.attemptsLeft : 0
      return done(next, { verified: false, triesLeft }, null)
    }
    case 'submit': {
      if (draft.submittedAt) return done(draft, { submitted: true })
      const missing = missingFacts(draft)
      if (missing.length > 0) return done(draft, { submitted: false, missing })
      const result = await steps.submit(draft)
      return done(applyToolResult(draft, { tool: 'submit', output: result }), { submitted: true })
    }
  }
}

/** One tool message answering each call, as the next model call needs. */
export function toolMessage(results: readonly { call: ToolCallRef; output: unknown }[]): ModelMessage {
  return {
    role: 'tool',
    content: results.map(({ call, output }) => ({
      type: 'tool-result' as const,
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      output: { type: 'json' as const, value: output as never },
    })),
  }
}

/** The model's side of calls the run makes on its behalf, for `toolMessage` to answer. */
export function toolCallMessage(calls: readonly ToolCallRef[]): ModelMessage {
  return {
    role: 'assistant',
    content: calls.map((call) => ({ type: 'tool-call' as const, toolCallId: call.toolCallId, toolName: call.toolName, input: {} })),
  }
}

/**
 * Whether the draft holds a photo nobody has analysed. The run analyses it
 * before the model speaks, because the model does not reliably call
 * `analysePhoto` after an upload.
 */
export const needsAnalysis = (draft: Draft) => draft.photo !== null && draft.analysis === null

/** What a widget the visitor typed past answers. */
export const TYPED_INSTEAD = { visitorTypedInstead: true } as const

/** Whether the conversation is over: submitted, or the last photo was unsafe and none may follow. */
export function conversationOver(draft: Draft): boolean {
  if (draft.submittedAt) return true
  return photoAttemptsLeft(draft) === 0 && draft.analysis !== null && photoVerdict(draft.analysis) === 'unsafe'
}

/** What the visitor sent, applied: the conversation, the messages to append, the photos to delete. */
export interface TurnReceived {
  conversation: Conversation
  messages: ModelMessage[]
  superseded: string[]
}

/** What the model reads for the name entered in the greeting. */
export const nameMessage = (name: string) => `My name is ${name}.`

/**
 * Applies what the visitor sent to the calls the last turn left open. Every
 * open call gets a result, because the model needs one for each: a matching
 * widget answer, or `TYPED_INSTEAD`. Answers that match no open call are a
 * resend or stale, and answer `null`, so the run keeps waiting.
 */
export function receiveTurn(
  conversation: Conversation,
  pending: readonly ToolCallRef[],
  input: TurnInput,
  context: TurnContext,
): TurnReceived | null {
  const typedInstead = () => pending.map((call) => ({ call, output: TYPED_INSTEAD }))
  const messages = (results: { call: ToolCallRef; output: unknown }[], text?: string): ModelMessage[] => [
    ...(results.length > 0 ? [toolMessage(results)] : []),
    ...(text === undefined ? [] : [{ role: 'user' as const, content: text }]),
  ]

  switch (input.kind) {
    case 'message':
      return { conversation, messages: messages(typedInstead(), input.text), superseded: [] }
    case 'name': {
      const draft = applyToolResult(conversation.draft, { tool: 'askName', output: { name: input.name } })
      return {
        conversation: { ...conversation, draft },
        messages: messages(typedInstead(), nameMessage(input.name)),
        superseded: [],
      }
    }
    case 'tools': {
      let current = conversation
      const superseded: string[] = []
      let matched = false
      const results = pending.map((call) => {
        const answer = input.answers.find((a) => a.toolCallId === call.toolCallId && a.toolName === call.toolName)
        if (!answer) return { call, output: TYPED_INSTEAD as unknown }
        matched = true
        const received = receiveAnswer(current, answer, input, context)
        current = received.conversation
        if (received.superseded) superseded.push(received.superseded)
        return { call, output: received.output }
      })
      return matched ? { conversation: current, messages: messages(results), superseded } : null
    }
  }
}
