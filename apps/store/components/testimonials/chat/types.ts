import type { DraftView } from '@repo/testimonials/draft'
import type { UIMessage } from 'ai'

/** A catalogue product as the confirm widget shows it. */
export interface ChatProduct {
  id: string
  name: string
  image: string | null
}

/** The chat's messages: the run streams the draft as a transient `data-draft` part. */
export type ChatMessage = UIMessage<unknown, { draft: DraftView }>

/** What GET /api/testimonials/chat answers: the conversation to resume, or none. */
export type CurrentChat = { runId: string; messages: ChatMessage[] } | null
