import 'server-only'
import { RedisError, type Command, type Redis } from './redis'

/**
 * How long a render or an action waits for Redis before it carries on
 * without it. Upstash answers a function in its own region in a few
 * milliseconds.
 */
export const REDIS_TIMEOUT_MS = 300

/**
 * Upstash Redis over its REST API with plain `fetch`, so the store needs no
 * client package. The token is a bearer credential: it goes in the header and
 * never into an error message. Every call is single-attempt.
 */
export function createUpstash(url: string, token: string): Redis {
  return {
    async run(commands: Command[]): Promise<unknown[]> {
      let response: Response
      try {
        response = await fetch(`${url}/pipeline`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(commands),
          cache: 'no-store',
          signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
        })
      } catch (error) {
        throw new RedisError(`Upstash did not answer: ${(error as Error).name}`)
      }
      // An unknown command fails the whole pipeline with one error body.
      if (!response.ok) throw new RedisError(`Upstash answered ${response.status}`)
      const replies = (await response.json()) as unknown
      if (!Array.isArray(replies) || replies.length !== commands.length) {
        throw new RedisError('Upstash answered with an unexpected body')
      }
      return replies.map((reply: { result?: unknown; error?: string }, index) => {
        if (reply.error !== undefined) {
          throw new RedisError(`${commands[index]?.[0]} failed: ${reply.error}`)
        }
        return reply.result ?? null
      })
    },
  }
}
