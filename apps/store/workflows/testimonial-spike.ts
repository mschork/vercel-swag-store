import { WorkflowAgent } from '@ai-sdk/workflow'
import type { ModelMessage } from 'ai'
import { defineHook, getWorkflowMetadata, getWritable, sleep } from 'workflow'
import { z } from 'zod'

/**
 * Slice 0 spike: one run holds a whole multi-turn chat. Throwaway; nothing
 * here merges.
 */

export const SPIKE_MODEL = process.env.SPIKE_MODEL ?? 'openai/gpt-5-nano'
const IDLE_TIMEOUT = '30m'
const MAX_TURNS = 20

/** What the message route delivers: a widget answer or a typed message. */
export type TurnInput =
  | { kind: 'tool'; toolCallId: string; toolName: string; output: unknown; email?: string }
  | { kind: 'message'; text: string }

export const turnHook = defineHook<TurnInput>()

export type Draft = { name?: string; product?: string; email?: 'provided' }

async function emitDraft(draft: Draft) {
  'use step'
  const writer = getWritable<{ type: 'data-draft'; id: string; data: Draft; transient: true }>({
    namespace: 'draft',
  }).getWriter()
  await writer.write({ type: 'data-draft', id: 'draft', data: draft, transient: true })
  writer.releaseLock()
}

/** Marks the end of a turn on the main stream; the route ends its response here. */
async function endTurn(turn: number) {
  'use step'
  const writer = getWritable<{ type: 'turn-end'; turn: number }>().getWriter()
  await writer.write({ type: 'turn-end', turn })
  writer.releaseLock()
}

async function closeStreams() {
  'use step'
  await getWritable().close()
  await getWritable({ namespace: 'draft' }).close()
}

async function lookupProductStep({ query }: { query: string }) {
  'use step'
  return { slug: query.toLowerCase().includes('mug') ? 'black-mug' : 'black-hoodie' }
}

const agent = new WorkflowAgent({
  model: SPIKE_MODEL,
  instructions: [
    'You collect a testimonial. Steps, in order: call askName, then call',
    'lookupProduct with what the visitor says they bought, then askEmail.',
    'Call exactly one tool per turn and say one short sentence before it.',
    'When a tool result says the visitor typed instead, answer briefly and call',
    'the same tool again. If the visitor asks what a tool returned, repeat the',
    'tool result verbatim. After askEmail is answered, say thanks and stop.',
  ].join(' '),
  tools: {
    askName: {
      description: "Show a text input for the visitor's name.",
      inputSchema: z.object({}),
    },
    askEmail: {
      description: "Show an email input. The result says whether an address was given.",
      inputSchema: z.object({}),
      // Spike 3: does this run for a result the workflow appends itself?
      toModelOutput: () => ({ type: 'text' as const, value: 'TO_MODEL_OUTPUT_RAN' }),
    },
    lookupProduct: {
      description: 'Find the product the visitor bought.',
      inputSchema: z.object({ query: z.string() }),
      execute: lookupProductStep,
    },
  },
})

export async function testimonialSpike({ firstMessage }: { firstMessage: string }) {
  'use workflow'
  const { workflowRunId } = getWorkflowMetadata()
  const hook = turnHook.create({ token: `testimonial-turn:${workflowRunId}` })
  const inputs = hook[Symbol.asyncIterator]()
  const messages: ModelMessage[] = [{ role: 'user', content: firstMessage }]
  const draft: Draft = {}
  const writable = getWritable()

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const result = await agent.stream({ messages, writable, preventClose: true, sendFinish: false })
    // result.messages starts with the system message built from `instructions`,
    // which the next call refuses in `messages`.
    messages.splice(0, messages.length, ...result.messages.filter((m) => m.role !== 'system'))

    for (const r of result.toolResults) {
      if (r.toolName === 'lookupProduct') draft.product = (r.output as { slug: string }).slug
    }
    await emitDraft(draft)
    await endTurn(turn)

    const unresolved = result.toolCalls.filter(
      (c) => !result.toolResults.some((r) => r.toolCallId === c.toolCallId),
    )

    const next = await Promise.race([
      inputs.next().then((r) => (r.done ? null : r.value)),
      sleep(IDLE_TIMEOUT).then(() => null),
    ])
    if (next === null) break

    if (next.kind === 'tool') {
      if (next.toolName === 'askName') draft.name = String((next.output as { name?: string }).name)
      // Spike 3: the address never reaches the model; the workflow writes what it sees.
      const modelOutput = next.toolName === 'askEmail' ? { provided: true, raw: next.output } : next.output
      if (next.toolName === 'askEmail') draft.email = 'provided'
      messages.push({
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: next.toolCallId, toolName: next.toolName, output: { type: 'json', value: modelOutput as never } },
        ],
      })
    } else {
      // A typed message while a widget is open still owes the model a tool result.
      if (unresolved.length > 0) {
        messages.push({
          role: 'tool',
          content: unresolved.map((c) => ({
            type: 'tool-result' as const,
            toolCallId: c.toolCallId,
            toolName: c.toolName,
            output: { type: 'json' as const, value: { visitorTypedInstead: true } },
          })),
        })
      }
      messages.push({ role: 'user', content: next.text })
    }
  }
  await closeStreams()
  return { turns: messages.length, draft }
}
