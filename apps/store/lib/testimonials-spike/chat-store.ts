import 'server-only'
import type { UIMessage } from 'ai'
import { serverEnv } from '@/lib/env'
import { createMemory } from '@/lib/session/memory'
import { createUpstash } from '@/lib/session/upstash'

/** Spike: a chat's messages and turn boundary, keyed by run, bound to a session. */
export type ChatRecord = { sid: string; messages: UIMessage[]; turnStart: number }

const redis =
  serverEnv.KV_REST_API_URL && serverEnv.KV_REST_API_TOKEN
    ? createUpstash(serverEnv.KV_REST_API_URL, serverEnv.KV_REST_API_TOKEN)
    : createMemory()
const TTL = String(60 * 60 * 24)

export async function readChat(runId: string): Promise<ChatRecord | null> {
  const [raw] = await redis.run([['GET', `chat:${runId}`]])
  return typeof raw === 'string' ? (JSON.parse(raw) as ChatRecord) : null
}

export async function saveChat(runId: string, record: ChatRecord) {
  await redis.run([
    ['SET', `chat:${runId}`, JSON.stringify(record), 'EX', TTL],
    ['SET', `chat-run:${record.sid}`, runId, 'EX', TTL],
  ])
}

export async function currentRun(sid: string): Promise<string | null> {
  const [raw] = await redis.run([['GET', `chat-run:${sid}`]])
  return typeof raw === 'string' ? raw : null
}
