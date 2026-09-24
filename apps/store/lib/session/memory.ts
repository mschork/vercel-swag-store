import { RedisError, type Command, type Redis } from './redis'

type Entry = { value: string | Map<string, string>; expiresAt?: number }

/**
 * The session store without Redis: the commands the store uses, over a `Map`
 * with expiries, answering in Upstash's reply shapes. It serves one process,
 * which is what a clone without the Upstash variables, CI and the tests get.
 * The map hangs off `globalThis`, because Next can load this module more than
 * once in one server and each copy has to see the same sessions.
 */
export function createMemory(now: () => number = Date.now): Redis {
  const store = sharedMap()

  const live = (key: string): Entry | undefined => {
    const entry = store.get(key)
    if (entry?.expiresAt !== undefined && entry.expiresAt <= now()) {
      store.delete(key)
      return undefined
    }
    return entry
  }

  const hash = (key: string, create: boolean): Map<string, string> | undefined => {
    const entry = live(key)
    if (entry === undefined) {
      if (!create) return undefined
      const fields = new Map<string, string>()
      store.set(key, { value: fields })
      return fields
    }
    if (!(entry.value instanceof Map)) {
      throw new RedisError('WRONGTYPE Operation against a key holding the wrong kind of value')
    }
    return entry.value
  }

  const run1 = ([name, key = '', ...args]: Command): unknown => {
    switch (name) {
      case 'GET': {
        const entry = live(key)
        if (entry === undefined) return null
        if (typeof entry.value !== 'string') throw new RedisError('WRONGTYPE')
        return entry.value
      }
      case 'SET': {
        const [value = '', ...options] = args
        if (options.includes('NX') && live(key) !== undefined) return null
        const ex = options.indexOf('EX')
        store.set(key, {
          value,
          ...(ex >= 0 ? { expiresAt: now() + Number(options[ex + 1]) * 1000 } : {}),
        })
        return 'OK'
      }
      case 'DEL':
        return [key, ...args].filter((name) => live(name) && store.delete(name)).length
      case 'EXPIRE': {
        const [seconds, option] = args
        const entry = live(key)
        if (entry === undefined) return 0
        if (option === 'NX' && entry.expiresAt !== undefined) return 0
        entry.expiresAt = now() + Number(seconds) * 1000
        return 1
      }
      case 'HGETALL':
        return [...(hash(key, false) ?? new Map()).entries()].flat()
      case 'HGET':
        return hash(key, false)?.get(args[0] ?? '') ?? null
      case 'HMGET': {
        const fields = hash(key, false)
        return args.map((field) => fields?.get(field) ?? null)
      }
      case 'HSET': {
        const fields = hash(key, true) as Map<string, string>
        let added = 0
        for (let i = 0; i + 1 < args.length; i += 2) {
          if (!fields.has(args[i] as string)) added += 1
          fields.set(args[i] as string, args[i + 1] as string)
        }
        return added
      }
      case 'HSETNX': {
        const fields = hash(key, true) as Map<string, string>
        const [field = '', value = ''] = args
        if (fields.has(field)) return 0
        fields.set(field, value)
        return 1
      }
      default:
        throw new RedisError(`ERR Command is not available: '${name}'`)
    }
  }

  return {
    async run(commands: Command[]): Promise<unknown[]> {
      return commands.map(run1)
    },
  }
}

const SHARED = Symbol.for('swag-store.session-memory')

function sharedMap(): Map<string, Entry> {
  const holder = globalThis as { [SHARED]?: Map<string, Entry> }
  holder[SHARED] ??= new Map()
  return holder[SHARED]
}
