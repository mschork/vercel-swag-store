import { beforeEach, describe, expect, it } from 'vitest'
import { createMemory } from './memory'

let clock = 1_000_000
const redis = createMemory(() => clock)

beforeEach(async () => {
  clock += 10_000_000
  await redis.run([['DEL', 'h', 's', 'x']])
})

describe('createMemory', () => {
  it('answers hash commands in Upstash reply shapes', async () => {
    expect(
      await redis.run([
        ['HSETNX', 'h', 'a', '1'],
        ['HSETNX', 'h', 'a', '2'],
        ['HSET', 'h', 'a', '3', 'b', '4'],
        ['HGETALL', 'h'],
        ['HGET', 'h', 'b'],
        ['HMGET', 'h', 'a', 'nope'],
        ['HGETALL', 'missing'],
      ]),
    ).toEqual([1, 0, 1, ['a', '3', 'b', '4'], '4', ['3', null], []])
  })

  it('expires a string after EX and a key after EXPIRE, and EXPIRE NX keeps the first expiry', async () => {
    await redis.run([
      ['SET', 's', 'v', 'EX', '10'],
      ['HSET', 'h', 'a', '1'],
    ])
    expect(
      await redis.run([
        ['EXPIRE', 'h', '10', 'NX'],
        ['EXPIRE', 'h', '100', 'NX'],
        ['EXPIRE', 'missing', '10'],
      ]),
    ).toEqual([1, 0, 0])
    clock += 9_000
    expect(await redis.run([['GET', 's'], ['HGET', 'h', 'a']])).toEqual(['v', '1'])
    clock += 1_000
    expect(await redis.run([['GET', 's'], ['HGETALL', 'h']])).toEqual([null, []])
  })

  it('sets a string with NX only when the key is missing', async () => {
    expect(await redis.run([['SET', 's', 'a', 'NX', 'EX', '10'], ['SET', 's', 'b', 'NX'], ['GET', 's']])).toEqual([
      'OK',
      null,
      'a',
    ])
    clock += 10_000
    expect(await redis.run([['SET', 's', 'c', 'NX'], ['GET', 's']])).toEqual(['OK', 'c'])
  })

  it('deletes keys and counts the ones that existed', async () => {
    await redis.run([['SET', 's', 'v']])
    expect(await redis.run([['DEL', 's', 'missing']])).toEqual([1])
  })

  it('refuses a command it does not know and a hash command on a string', async () => {
    await expect(redis.run([['BOGUS']])).rejects.toThrow(/not available/)
    await redis.run([['SET', 'x', 'v']])
    await expect(redis.run([['HGETALL', 'x']])).rejects.toThrow(/WRONGTYPE/)
    await expect(redis.run([['HSET', 'h', 'a', '1'], ['GET', 'h']])).rejects.toThrow(/WRONGTYPE/)
  })

  it('shares one map between instances in the same process', async () => {
    await redis.run([['SET', 's', 'shared']])
    expect(await createMemory(() => clock).run([['GET', 's']])).toEqual(['shared'])
  })
})
