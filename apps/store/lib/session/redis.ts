/** One Redis command and its arguments, as Upstash's REST API takes it. */
export type Command = [name: string, ...args: string[]]

/**
 * What the session store needs from Redis: a pipeline that answers one reply
 * per command, in order, in the shapes Upstash's REST API uses. Throws
 * `RedisError` when any command fails.
 */
export interface Redis {
  run(commands: Command[]): Promise<unknown[]>
}

export class RedisError extends Error {
  override readonly name = 'RedisError'
}
