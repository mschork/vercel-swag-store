import 'server-only'
import { cache } from 'react'
import { serverEnv } from '@/lib/env'
import { getSessionId } from './cookie'
import { createMemory } from './memory'
import {
  DRAWN_AT_FIELD,
  parseCart,
  parseChat,
  parseDraw,
  parseVisit,
  STOCK_FIELD,
  type CartRecord,
  type ChatRecord,
  type VisitRecord,
} from './records'
import type { Command, Redis } from './redis'
import { createUpstash } from './upstash'

export type { CartRecord, ChatRecord, VisitRecord } from './records'

/**
 * The session store: what the store keeps about one browser, under its
 * session id, in Redis (docs/adr/0007-the-session-store.md). Never
 * `"use cache"`. The only module that talks to Redis.
 *
 * Every function degrades rather than throws. A read that fails answers
 * `'unavailable'`; a claim that fails answers what it was given, so the
 * caller shows the API's answer without keeping it; a write that fails
 * answers `false`. Each failure is logged without the values involved.
 */

/** A testimonial conversation is kept a day from its last turn. */
export const CHAT_TTL_SECONDS = 60 * 60 * 24

/** A visit lasts one day from its first draw, whatever happens inside it. */
export const VISIT_TTL_SECONDS = 60 * 60 * 24

/** The API forgets a cart after a day without a change; the mirror follows it. */
export const CART_TTL_SECONDS = 60 * 60 * 24

export type SessionState = { visit: VisitRecord | null; cart: CartRecord | null }
export type Session = SessionState & { sid: string }
export type Unavailable = 'unavailable'

/** The cart as the store saves it; `savedAt` is stamped on the way in. */
export type CartToSave = Omit<CartRecord, 'savedAt'>

const visitKey = (sid: string) => `swag:sess:${sid}:visit`
const cartKey = (sid: string) => `swag:sess:${sid}:cart`
const currentChatKey = (sid: string) => `swag:sess:${sid}:chat`
const chatKey = (runId: string) => `swag:chat:${runId}`
const uploadsKey = (runId: string) => `swag:chat:${runId}:uploads`
const endedKey = (runId: string) => `swag:chat:${runId}:ended`

export function createSessionStore(redis: Redis, now: () => number = Date.now) {
  const run = async (label: string, commands: Command[]): Promise<unknown[] | null> => {
    try {
      return await redis.run(commands)
    } catch (error) {
      console.error(`[session] ${label} failed: ${(error as Error).message}`)
      return null
    }
  }

  // Every write to the visit starts it if it is new; the expiry is set only
  // then, so it counts from the first draw.
  const opening = (sid: string): Command[] => [
    ['HSETNX', visitKey(sid), DRAWN_AT_FIELD, String(Math.floor(now() / 1000))],
  ]
  const expiring = (sid: string): Command => [
    'EXPIRE',
    visitKey(sid),
    String(VISIT_TTL_SECONDS),
    'NX',
  ]

  return {
    /** The visit and the cart mirror in one round trip. */
    async read(sid: string): Promise<SessionState | Unavailable> {
      const replies = await run('read', [
        ['HGETALL', visitKey(sid)],
        ['GET', cartKey(sid)],
      ])
      if (!replies) return 'unavailable'
      return { visit: parseVisit(replies[0]), cart: parseCart(replies[1]) }
    },

    /**
     * Keeps each draw unless the visit already holds one for that product,
     * and answers the draws that won. Two renders that draw the same product
     * at once therefore always show the same number.
     */
    async claimStock(
      sid: string,
      draws: Readonly<Record<string, number>>,
    ): Promise<Record<string, number>> {
      const ids = Object.keys(draws)
      if (ids.length === 0) return {}
      const replies = await run('claim stock', [
        ...opening(sid),
        ...ids.map((id): Command => [
          'HSETNX',
          visitKey(sid),
          STOCK_FIELD + id,
          String(draws[id]),
        ]),
        expiring(sid),
        ['HMGET', visitKey(sid), ...ids.map((id) => STOCK_FIELD + id)],
      ])
      const kept = replies?.at(-1)
      return Object.fromEntries(
        ids.map((id, index) => [
          id,
          (Array.isArray(kept) ? parseDraw(kept[index]) : null) ?? (draws[id] as number),
        ]),
      )
    },

    /** Overwrites draws, which only an order does. */
    async setStock(sid: string, draws: Readonly<Record<string, number>>): Promise<boolean> {
      const fields = Object.entries(draws).flatMap(([id, draw]) => [STOCK_FIELD + id, String(draw)])
      if (fields.length === 0) return true
      const replies = await run('set stock', [
        ...opening(sid),
        ['HSET', visitKey(sid), ...fields],
        expiring(sid),
      ])
      return replies !== null
    },

    async clearVisit(sid: string): Promise<boolean> {
      return (await run('clear visit', [['DEL', visitKey(sid)]])) !== null
    },

    /** Replaces the mirror with the API's latest answer; its day starts again. */
    async setCart(sid: string, cart: CartToSave): Promise<boolean> {
      const record: CartRecord = { ...cart, savedAt: now() }
      const replies = await run('set cart', [
        ['SET', cartKey(sid), JSON.stringify(record), 'EX', String(CART_TTL_SECONDS)],
      ])
      return replies !== null
    },

    /**
     * Saves a new cart as the mirror unless the session already holds one,
     * and answers the one that won, or `null` when Redis failed. Two actions
     * that open a cart at once therefore both write into the same cart.
     */
    async claimCart(sid: string, cart: CartToSave): Promise<CartRecord | null> {
      const record: CartRecord = { ...cart, savedAt: now() }
      const replies = await run('claim cart', [
        ['SET', cartKey(sid), JSON.stringify(record), 'NX', 'EX', String(CART_TTL_SECONDS)],
        ['GET', cartKey(sid)],
      ])
      return replies ? parseCart(replies[1]) : null
    },

    async clearCart(sid: string): Promise<boolean> {
      return (await run('clear cart', [['DEL', cartKey(sid)]])) !== null
    },

    /** Binds a new conversation to the session and makes it the session's current one. */
    async openChat(sid: string, runId: string): Promise<boolean> {
      const record: ChatRecord = { sid, messages: [], turnStart: 0 }
      const ttl = String(CHAT_TTL_SECONDS)
      const replies = await run('open chat', [
        ['SET', chatKey(runId), JSON.stringify(record), 'EX', ttl],
        ['SET', currentChatKey(sid), runId, 'EX', ttl],
      ])
      return replies !== null
    },

    async readChat(runId: string): Promise<ChatRecord | null | Unavailable> {
      const replies = await run('read chat', [['GET', chatKey(runId)]])
      return replies ? parseChat(replies[0]) : 'unavailable'
    },

    async saveChat(runId: string, record: ChatRecord): Promise<boolean> {
      const ttl = String(CHAT_TTL_SECONDS)
      const replies = await run('save chat', [
        ['SET', chatKey(runId), JSON.stringify(record), 'EX', ttl],
        ['EXPIRE', currentChatKey(record.sid), ttl],
      ])
      return replies !== null
    },

    /** The run id of the session's latest conversation, whether or not it has ended. */
    async currentChat(sid: string): Promise<string | null | Unavailable> {
      const replies = await run('current chat', [['GET', currentChatKey(sid)]])
      if (!replies) return 'unavailable'
      return typeof replies[0] === 'string' ? replies[0] : null
    },

    /**
     * Marks the conversation over: it takes no more turns, though its run may
     * still wait for an editor. Written by the run itself.
     */
    async endChat(runId: string): Promise<boolean> {
      const replies = await run('end chat', [['SET', endedKey(runId), '1', 'EX', String(CHAT_TTL_SECONDS)]])
      return replies !== null
    },

    async chatEnded(runId: string): Promise<boolean | Unavailable> {
      const replies = await run('chat ended', [['GET', endedKey(runId)]])
      return replies ? replies[0] === '1' : 'unavailable'
    },

    /** Counts one more photo upload for the run and answers the count, or `null` when Redis failed. */
    async countUpload(runId: string): Promise<number | null> {
      const replies = await run('count upload', [
        ['INCR', uploadsKey(runId)],
        ['EXPIRE', uploadsKey(runId), String(CHAT_TTL_SECONDS)],
      ])
      const count = Number(replies?.[0])
      return Number.isInteger(count) ? count : null
    },
  }
}

export type SessionStore = ReturnType<typeof createSessionStore>

/** Upstash when both variables are set, otherwise one process's memory. */
export const sessionStore: SessionStore = createSessionStore(
  serverEnv.KV_REST_API_URL && serverEnv.KV_REST_API_TOKEN
    ? createUpstash(serverEnv.KV_REST_API_URL, serverEnv.KV_REST_API_TOKEN)
    : createMemory(),
)

/**
 * The request's session: its id, visit and cart mirror. Memoized per request,
 * so every hole in a render shares one round trip. `'unavailable'` when the
 * request carries no session id or Redis did not answer.
 */
export const getSession = cache(async (): Promise<Session | Unavailable> => {
  const sid = await getSessionId()
  if (!sid) return 'unavailable'
  const state = await sessionStore.read(sid)
  return state === 'unavailable' ? state : { sid, ...state }
})
