import { describe, expect, it } from 'vitest'
import { inOrder } from './in-order'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('inOrder', () => {
  it('starts a write only once the one before it has answered', async () => {
    const first = deferred<string>()
    const started: string[] = []
    const one = inOrder(() => {
      started.push('one')
      return first.promise
    })
    const two = inOrder(async () => {
      started.push('two')
      return 'two'
    })
    await Promise.resolve()
    expect(started).toEqual(['one'])

    first.resolve('one')
    expect(await one).toBe('one')
    expect(await two).toBe('two')
    expect(started).toEqual(['one', 'two'])
  })

  it('runs the next write after one that failed, and passes the failure on', async () => {
    const failing = inOrder(() => Promise.reject(new Error('network')))
    const next = inOrder(async () => 'saved')

    await expect(failing).rejects.toThrow('network')
    expect(await next).toBe('saved')
  })
})
