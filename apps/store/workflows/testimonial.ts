import { WorkflowAgent, type ModelCallStreamPart } from '@ai-sdk/workflow'
import type { ModelMessage } from 'ai'
import { defineHook, getWorkflowMetadata, getWritable, sleep } from 'workflow'
import { z } from 'zod'
// Subpaths, not the package root: the workflow body runs in a sandbox, and
// the root pulls in the Sanity client and the model calls.
import {
  IDLE_TIMEOUT,
  MAX_MODEL_CALLS_PER_TURN,
  MAX_TURNS,
  MODEL,
  TURN_HOOK_PREFIX,
} from '@repo/testimonials/constants'
import { draftView, emptyDraft, type Draft } from '@repo/testimonials/draft'
import { AGENT_INSTRUCTIONS, type PromptProduct } from '@repo/testimonials/prompt'
import { ReviewQuoteInputSchema } from '@repo/testimonials/schemas'
import type { DraftPart, RunPart } from '@/lib/testimonials/stream'
import * as steps from '@/lib/testimonials/steps'
import {
  conversationOver,
  isClientTool,
  isServerTool,
  receiveTurn,
  runServerTool,
  toolMessage,
  type Conversation,
  type ServerSteps,
  type ToolCallRef,
  type TurnContext,
  type TurnInput,
} from '@/lib/testimonials/turn'

/**
 * One testimonial conversation as a durable run
 * (specs/E25-testimonial-agent.md, docs/adr/0008-testimonial-submissions.md).
 * Each turn streams the agent until it answers or asks for a widget, writes
 * the draft and a `turn-end` part, and waits on the turn hook for the
 * visitor. No tool has an `execute`: the run executes the server tools
 * itself, against the draft as it stands, so the model's arguments never
 * reach them and it sees only what `lib/testimonials/turn.ts` returns.
 * Started by the chat route with the first message, or by the upload route
 * with none when the first photo comes before any message.
 */

/** Resumed by POST /api/testimonials/chat/<runId>/message. */
export const turnHook = defineHook<TurnInput>()

export type TestimonialResult = { submitted: boolean; turns: number }

const GOODBYE =
  'That is as far as this conversation goes. Thank you for your time; you can start a new one from the testimonials page.'

const UNANSWERED = 'Sorry, I could not answer just now. Please send that again in a minute.'

const noInput = z.object({})

const agent = new WorkflowAgent({
  model: MODEL,
  instructions: AGENT_INSTRUCTIONS,
  tools: {
    askPhoto: { description: 'Show the photo upload.', inputSchema: noInput },
    analysePhoto: {
      description: "Check the visitor's latest photo: quality, safety, the store mark and the products it shows.",
      inputSchema: noInput,
    },
    confirmProduct: {
      description: 'Show the products the analysis found and the catalogue, for the visitor to confirm or pick one.',
      inputSchema: noInput,
    },
    askName: { description: 'Ask for the name to publish.', inputSchema: noInput },
    reviewQuote: {
      description: `Show the quote for the visitor to approve or edit. Pass their words, or a shorter version when they are too long.`,
      inputSchema: ReviewQuoteInputSchema,
    },
    checkText: { description: 'Screen the name and the quote.', inputSchema: noInput },
    askConsent: { description: 'Ask for consent to publish the photo, the name and the quote.', inputSchema: noInput },
    askEmail: { description: 'Ask for an email address.', inputSchema: noInput },
    sendCode: { description: 'Email a verification code to the address.', inputSchema: noInput },
    askCode: { description: 'Ask for the code from the email.', inputSchema: noInput },
    verifyCode: { description: 'Check the code the visitor entered.', inputSchema: noInput },
    submit: { description: 'Submit the testimonial for an editor to review.', inputSchema: noInput },
  },
})

async function loadCatalogue(): Promise<PromptProduct[]> {
  'use step'
  return steps.catalogue()
}
async function analyse(pathname: string, products: PromptProduct[]) {
  'use step'
  return steps.analyse(pathname, products)
}
async function screen(draft: Draft) {
  'use step'
  return steps.screen(draft)
}
async function sendCode(runId: string, email: Draft['email']) {
  'use step'
  return steps.sendCode(runId, email)
}
async function verifyCode(runId: string, email: Draft['email'], code: string) {
  'use step'
  return steps.verifyCode(runId, email, code)
}
async function submit(runId: string, draft: Draft) {
  'use step'
  return steps.submit(runId, draft)
}
async function dropPhotos(runId: string, keep?: string) {
  'use step'
  await steps.dropPhotos(runId, keep)
}

async function write(parts: RunPart[]) {
  'use step'
  const writer = getWritable<RunPart>().getWriter()
  for (const part of parts) await writer.write(part)
  writer.releaseLock()
}

async function closeStream() {
  'use step'
  await getWritable().close()
}

const draftPart = (draft: Draft): DraftPart => ({
  type: 'data-draft',
  id: 'draft',
  data: draftView(draft),
  transient: true,
})

const textParts = (id: string, text: string): RunPart[] => [
  { type: 'text-start', id },
  { type: 'text-delta', id, text },
  { type: 'text-end', id },
]

export async function testimonial(first: TurnInput | null): Promise<TestimonialResult> {
  'use workflow'
  const { workflowRunId: runId } = getWorkflowMetadata()
  const hook = turnHook.create({ token: `${TURN_HOOK_PREFIX}${runId}` })
  const inputs = hook[Symbol.asyncIterator]()
  const writable = getWritable<ModelCallStreamPart>()

  const products = await loadCatalogue()
  const context: TurnContext = { runId, products }
  // Arrows, so no step is called as a method: its `this` would have to be
  // serialized, and this object holds functions.
  const serverSteps: ServerSteps = {
    analyse: (pathname) => analyse(pathname, products),
    screen: (draft) => screen(draft),
    sendCode: (email) => sendCode(runId, email),
    verifyCode: (email, code) => verifyCode(runId, email, code),
    submit: (draft) => submit(runId, draft),
  }

  let conversation: Conversation = { draft: emptyDraft(), code: null }
  let messages: ModelMessage[] = []
  let pending: ToolCallRef[] = []
  let input: TurnInput | null = first
  let turns = 0

  for (;;) {
    input ??= await Promise.race([
      inputs.next().then((next) => (next.done ? null : next.value)),
      sleep(IDLE_TIMEOUT).then(() => null),
    ])
    if (!input) break

    const received = receiveTurn(conversation, pending, input, context)
    input = null
    if (!received) {
      // The route that delivered it is reading this turn; end it empty.
      await write([{ type: 'turn-end' }])
      continue
    }
    conversation = received.conversation
    messages.push(...received.messages)
    pending = []
    if (received.superseded.length > 0) await dropPhotos(runId, conversation.draft.photo?.pathname)

    turns += 1
    if (turns > MAX_TURNS) {
      await write([...textParts(`goodbye-${turns}`, GOODBYE), { type: 'turn-end' }])
      break
    }

    for (let call = 0; call < MAX_MODEL_CALLS_PER_TURN; call++) {
      let result: Awaited<ReturnType<typeof agent.stream>>
      try {
        result = await agent.stream({ messages, writable, preventClose: true, sendFinish: false })
      } catch {
        // The agent's model step does not retry, and a failure here would
        // fail the run. The conversation keeps what it had before the call.
        await write(textParts(`unanswered-${turns}-${call}`, UNANSWERED))
        break
      }
      // The next call refuses the system message that `result.messages` starts with.
      messages = result.messages.filter((message) => message.role !== 'system')
      const open = result.toolCalls.filter(
        (toolCall) => !result.toolResults.some((toolResult) => toolResult.toolCallId === toolCall.toolCallId),
      )
      pending = open
        .filter((toolCall) => isClientTool(toolCall.toolName))
        .map(({ toolCallId, toolName }) => ({ toolCallId, toolName }))
      const others = open.filter((toolCall) => !isClientTool(toolCall.toolName))
      if (others.length === 0) break

      const results: { call: ToolCallRef; output: unknown }[] = []
      for (const toolCall of others) {
        const call = { toolCallId: toolCall.toolCallId, toolName: toolCall.toolName }
        if (!isServerTool(call.toolName)) {
          results.push({ call, output: { error: `There is no tool called ${call.toolName}.` } })
          continue
        }
        try {
          const outcome = await runServerTool(call.toolName, conversation, serverSteps, context)
          conversation = outcome.conversation
          results.push({ call, output: outcome.output })
        } catch {
          // A step that failed all its retries; the model may try again.
          results.push({ call, output: { error: 'That did not work this time. Try again.' } })
        }
      }
      messages.push(toolMessage(results))
      await write([
        ...results.map(({ call, output }): RunPart => ({
          type: 'tool-result',
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          input: {},
          output,
        })),
        draftPart(conversation.draft),
      ])
      if (pending.length > 0) break
    }

    await write([draftPart(conversation.draft), { type: 'turn-end' }])
    if (conversationOver(conversation.draft)) break
  }

  hook.dispose()
  // A submitted photo waits for the editor; every other one goes now.
  if (!conversation.draft.submittedAt) await dropPhotos(runId)
  await closeStream()
  return { submitted: conversation.draft.submittedAt !== null, turns }
}
