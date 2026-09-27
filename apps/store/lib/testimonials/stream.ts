import 'server-only'
import { toUIMessageChunk, type ModelCallStreamPart } from '@ai-sdk/workflow'
import type { DraftView } from '@repo/testimonials/draft'
import { createUIMessageStreamResponse, type UIMessageChunk } from 'ai'
import { getRun } from 'workflow/api'

/**
 * Reading a testimonial run's stream as one turn of UI message chunks. The
 * run writes the agent's parts, a `data-draft` part after every change to the
 * draft and a `turn-end` part when it waits for the visitor, all on its main
 * stream, so the chunk indices a reconnect resumes from are the same on
 * every read.
 */

export type DraftPart = { type: 'data-draft'; id: 'draft'; data: DraftView; transient: true }
export type TurnEndPart = { type: 'turn-end' }
export type RunPart = ModelCallStreamPart | DraftPart | TurnEndPart

/** How often a streaming route checks whether the run failed, which leaves its stream open. */
export const RUN_CHECK_MS = 3000

export const RUN_ID_HEADER = 'x-workflow-run-id'

/**
 * One turn as UI chunks: `start` first, `finish` at the run's `turn-end` or
 * at the end of its stream. `toUIMessageChunk` drops parts it does not know,
 * so draft parts pass through here. The first `skip` chunks are left out,
 * counted over everything this emits, as the transport counts them.
 */
export function turnChunks(skip = 0): TransformStream<RunPart, UIMessageChunk> {
  let index = 0
  const emit = (controller: TransformStreamDefaultController<UIMessageChunk>, chunk: UIMessageChunk) => {
    if (index++ >= skip) controller.enqueue(chunk)
  }
  const finish = (controller: TransformStreamDefaultController<UIMessageChunk>) => {
    emit(controller, { type: 'finish-step' })
    emit(controller, { type: 'finish' })
  }
  return new TransformStream({
    start(controller) {
      emit(controller, { type: 'start' })
      emit(controller, { type: 'start-step' })
    },
    transform(part, controller) {
      if (part.type === 'turn-end') {
        finish(controller)
        controller.terminate()
      } else if (part.type === 'data-draft') {
        emit(controller, part)
      } else {
        const chunk = toUIMessageChunk(part)
        if (chunk) emit(controller, chunk)
      }
    },
    flush: finish,
  })
}

/**
 * The run's current turn, read from `turnStart`, as a UI message stream
 * response. When the run fails or is cancelled the response ends with an
 * error chunk, because a failed run never closes its stream.
 */
export function turnResponse(runId: string, turnStart: number, skip = 0): Response {
  const run = getRun(runId)
  const chunks = run.getReadable<RunPart>({ startIndex: turnStart }).pipeThrough(turnChunks(skip))
  const reader = chunks.getReader()
  let timer: ReturnType<typeof setInterval> | undefined
  let stopped = false

  const stream = new ReadableStream<UIMessageChunk>({
    async start(controller) {
      timer = setInterval(async () => {
        const status = await run.status.catch(() => null)
        if (status === 'failed' || status === 'cancelled') {
          stopped = true
          await reader.cancel().catch(() => {})
        }
      }, RUN_CHECK_MS)
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      } catch {
        stopped = true
      } finally {
        clearInterval(timer)
      }
      if (stopped) {
        controller.enqueue({ type: 'error', errorText: 'The conversation stopped.' })
        controller.enqueue({ type: 'finish' })
      }
      controller.close()
    },
    async cancel() {
      clearInterval(timer)
      await reader.cancel().catch(() => {})
    },
  })
  return createUIMessageStreamResponse({ stream, headers: { [RUN_ID_HEADER]: runId } })
}

/** The main stream's next index: where the next turn begins. */
export async function nextIndex(runId: string): Promise<number> {
  const readable = getRun(runId).getReadable()
  const tail = await readable.getTailIndex()
  await readable.cancel().catch(() => {})
  return tail + 1
}
