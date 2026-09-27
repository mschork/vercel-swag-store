import type { UIMessageChunk } from 'ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RunPart } from './stream'

const run = vi.hoisted(() => ({
  parts: [] as unknown[],
  status: 'running' as string,
  tail: 7,
  startIndex: undefined as number | undefined,
}))

vi.mock('workflow/api', () => ({
  getRun: () => ({
    getReadable: (options?: { startIndex?: number }) => {
      run.startIndex = options?.startIndex
      const stream = new ReadableStream({
        start(controller) {
          for (const part of run.parts) controller.enqueue(part)
          if (run.status !== 'failed') controller.close()
        },
      }) as ReadableStream & { getTailIndex: () => Promise<number> }
      stream.getTailIndex = async () => run.tail
      return stream
    },
    get status() {
      return Promise.resolve(run.status)
    },
  }),
}))

const { RUN_CHECK_MS, nextIndex, turnChunks, turnResponse } = await import('./stream')

async function collect(parts: RunPart[], skip = 0): Promise<UIMessageChunk[]> {
  const chunks: UIMessageChunk[] = []
  const source = new ReadableStream<RunPart>({
    start(controller) {
      for (const part of parts) controller.enqueue(part)
      controller.close()
    },
  })
  const reader = source.pipeThrough(turnChunks(skip)).getReader()
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return chunks
    chunks.push(value)
  }
}

const draft = { type: 'data-draft', id: 'draft', data: { missing: [] }, transient: true } as unknown as RunPart
const parts: RunPart[] = [
  { type: 'text-start', id: 't' },
  { type: 'text-delta', id: 't', text: 'Hi' },
  { type: 'text-end', id: 't' },
  { type: 'model-call-end' } as unknown as RunPart,
  draft,
  { type: 'turn-end' },
  { type: 'text-start', id: 'next' },
]

describe('turnChunks', () => {
  it('frames one turn, passes the draft through and stops at turn-end', async () => {
    expect((await collect(parts)).map((chunk) => chunk.type)).toEqual([
      'start',
      'start-step',
      'text-start',
      'text-delta',
      'text-end',
      'data-draft',
      'finish-step',
      'finish',
    ])
  })

  it('skips the chunks the browser already has', async () => {
    expect((await collect(parts, 5)).map((chunk) => chunk.type)).toEqual(['data-draft', 'finish-step', 'finish'])
  })

  it('finishes when the stream ends without a turn-end', async () => {
    expect((await collect([{ type: 'text-start', id: 't' }])).at(-1)).toEqual({ type: 'finish' })
  })
})

describe('turnResponse', () => {
  beforeEach(() => {
    run.parts = parts
    run.status = 'running'
  })
  afterEach(() => vi.useRealTimers())

  it('streams the turn from its start with the run id header', async () => {
    const response = turnResponse('wrun_1', 12, 0)
    expect(response.headers.get('x-workflow-run-id')).toBe('wrun_1')
    const body = await response.text()
    expect(run.startIndex).toBe(12)
    expect(body).toContain('"type":"finish"')
    expect(body).not.toContain('"id":"next"')
  })

  it('ends with an error when the run fails, which leaves its stream open', async () => {
    vi.useFakeTimers()
    run.parts = [{ type: 'text-start', id: 't' }]
    run.status = 'failed'
    const text = turnResponse('wrun_1', 0).text()
    await vi.advanceTimersByTimeAsync(RUN_CHECK_MS)
    const body = await text
    expect(body).toContain('"type":"error"')
    expect(body).toContain('"type":"finish"')
  })
})

describe('nextIndex', () => {
  it('is one past the tail', async () => {
    expect(await nextIndex('wrun_1')).toBe(8)
  })
})
