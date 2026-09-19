import type { DemandClient } from './store.ts'

/** What a fake transaction was asked to do, in order. Test helper only. */
export type Op =
  | { op: 'createIfNotExists'; doc: Record<string, unknown> }
  | { op: 'patch'; id: string; ifRevisionId?: string; set?: Record<string, unknown>; inc?: Record<string, number>; unset?: string[] }
  | { op: 'delete'; query: string; params: Record<string, unknown> }

class FakePatch {
  constructor(readonly record: Extract<Op, { op: 'patch' }>) {}
  ifRevisionId(rev: string) {
    this.record.ifRevisionId = rev
    return this
  }
  set(values: Record<string, unknown>) {
    this.record.set = { ...this.record.set, ...values }
    return this
  }
  inc(values: Record<string, number>) {
    this.record.inc = values
    return this
  }
  unset(keys: string[]) {
    this.record.unset = keys
    return this
  }
}

/**
 * A client that answers `fetch` from a queue and records every mutation.
 * `commits` holds one array of operations per committed transaction.
 */
export function fakeClient(answers: unknown[], options: { failCommit?: Error } = {}) {
  const commits: Op[][] = []
  const deletes: Op[] = []
  const queries: string[] = []
  const client = {
    fetch: async (query: string) => {
      queries.push(query)
      if (answers.length === 0) throw new Error(`Unexpected fetch: ${query}`)
      return answers.shift()
    },
    delete: async (selection: { query: string; params: Record<string, unknown> }) => {
      deletes.push({ op: 'delete', ...selection })
    },
    transaction: () => {
      const ops: Op[] = []
      const transaction = {
        createIfNotExists(doc: Record<string, unknown>) {
          ops.push({ op: 'createIfNotExists', doc })
          return transaction
        },
        patch(id: string, build: (patch: FakePatch) => FakePatch) {
          const record: Extract<Op, { op: 'patch' }> = { op: 'patch', id }
          build(new FakePatch(record))
          ops.push(record)
          return transaction
        },
        async commit() {
          if (options.failCommit) throw options.failCommit
          commits.push(ops)
        },
      }
      return transaction
    },
  }
  // The fake implements only the calls store.ts makes.
  return { client: client as unknown as DemandClient, commits, deletes, queries }
}
