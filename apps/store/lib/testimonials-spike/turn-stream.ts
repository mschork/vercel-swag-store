import 'server-only'
import { createModelCallToUIChunkTransform } from '@ai-sdk/workflow'
import { createUIMessageStreamResponse, type UIMessageChunk } from 'ai'
import { getRun } from 'workflow/api'

/**
 * Spike: one turn of the run's stream as a UI message response. Reads the
 * main stream from `turnStart`, stops at the run's `turn-end` marker (the
 * transform's flush then writes `finish`), and merges the draft namespace in.
 */
export function turnResponse(runId: string, turnStart: number, uiStartIndex = 0): Response {
  const run = getRun(runId)
  const main = run
    .getReadable({ startIndex: turnStart })
    .pipeThrough(
      new TransformStream({
        transform(part, controller) {
          if (part?.type === 'turn-end') controller.terminate()
          else controller.enqueue(part)
        },
      }),
    )
    .pipeThrough(createModelCallToUIChunkTransform({ uiStartIndex }))
  const draft = run.getReadable<UIMessageChunk>({ namespace: 'draft', startIndex: -1 })

  const merged = new ReadableStream<UIMessageChunk>({
    async start(controller) {
      const draftReader = draft.getReader()
      let open = true
      const pumpDraft = (async () => {
        try {
          for (;;) {
            const { value, done } = await draftReader.read()
            if (done || !open) return
            controller.enqueue(value)
          }
        } catch {
          // cancelled when the turn ends
        }
      })()
      const mainReader = main.getReader()
      for (;;) {
        const { value, done } = await mainReader.read()
        if (done) break
        controller.enqueue(value)
      }
      open = false
      await draftReader.cancel().catch(() => {})
      await pumpDraft
      // The run writes the turn's draft before its turn-end marker, but the
      // two streams race; send the latest draft again before closing.
      const last = run.getReadable<UIMessageChunk>({ namespace: 'draft', startIndex: -1 }).getReader()
      const { value } = await last.read()
      await last.cancel().catch(() => {})
      if (value) controller.enqueue(value)
      controller.close()
    },
  })
  return createUIMessageStreamResponse({ stream: merged, headers: { 'x-workflow-run-id': runId } })
}

/** The main stream's next index: where the next turn begins. */
export async function nextIndex(runId: string): Promise<number> {
  const readable = getRun(runId).getReadable()
  const tail = await readable.getTailIndex()
  await readable.cancel().catch(() => {})
  return tail + 1
}
