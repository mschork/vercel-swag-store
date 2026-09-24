import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCall, headerOf, jsonResponse, mockFetch } from '@/test/helpers'
import { RedisError } from './redis'
import { createUpstash, REDIS_TIMEOUT_MS } from './upstash'

const redis = createUpstash('https://redis.test', 'redis-token')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createUpstash', () => {
  it('posts the commands as one pipeline with the token as a bearer', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(jsonResponse(200, [{ result: 'OK' }, { result: null }]))
    const timeout = vi.spyOn(AbortSignal, 'timeout')

    await expect(
      redis.run([
        ['SET', 'k', 'v'],
        ['GET', 'missing'],
      ]),
    ).resolves.toEqual(['OK', null])

    const [url, init] = fetchCall(fetchMock)
    expect(url).toBe('https://redis.test/pipeline')
    expect(init.method).toBe('POST')
    expect(headerOf(init, 'authorization')).toBe('Bearer redis-token')
    expect(JSON.parse(String(init.body))).toEqual([
      ['SET', 'k', 'v'],
      ['GET', 'missing'],
    ])
    expect(timeout).toHaveBeenCalledWith(REDIS_TIMEOUT_MS)
  })

  it('throws when one command fails, naming the command and not the token', async () => {
    mockFetch().mockResolvedValue(
      jsonResponse(200, [{ result: 1 }, { error: 'WRONGTYPE Operation' }]),
    )
    const failure = redis.run([
      ['HSETNX', 'k', 'f', 'v'],
      ['GET', 'k'],
    ])
    await expect(failure).rejects.toThrow(RedisError)
    await expect(failure).rejects.toThrow(/GET failed: WRONGTYPE/)
    await expect(failure).rejects.not.toThrow(/redis-token/)
  })

  it('throws on an error status and on a body that is not one reply per command', async () => {
    mockFetch().mockResolvedValueOnce(jsonResponse(400, { error: 'ERR unknown' }))
    await expect(redis.run([['GET', 'k']])).rejects.toThrow(/answered 400/)
    mockFetch().mockResolvedValueOnce(jsonResponse(200, []))
    await expect(redis.run([['GET', 'k']])).rejects.toThrow(/unexpected body/)
  })

  it('throws a RedisError when the request times out or cannot connect', async () => {
    mockFetch().mockRejectedValue(new DOMException('timed out', 'TimeoutError'))
    await expect(redis.run([['GET', 'k']])).rejects.toThrow(/did not answer: TimeoutError/)
  })
})
