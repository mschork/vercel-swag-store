'use client'

import { useChat } from '@ai-sdk/react'
import { WorkflowChatTransport } from '@ai-sdk/workflow/client'
import { CLIENT_TOOLS, MAX_PHOTO_ATTEMPTS, MESSAGE_MAX_LENGTH, type ClientTool } from '@repo/testimonials/constants'
import type { DraftView } from '@repo/testimonials/draft'
import { isToolUIPart, type ChatOnDataCallback } from 'ai'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DraftBar, DraftCard } from './draft-card'
import { runOfPathname } from './photo'
import type { ChatMessage, ChatProduct, CurrentChat } from './types'
import {
  CodeWidget,
  ConfirmWidget,
  ConsentWidget,
  EmailWidget,
  NameWidget,
  PhotoWidget,
  QuoteWidget,
} from './widgets'

const GREETING =
  'Hi! Share a photo of something you bought from us, and I will help you turn it into a testimonial. You can also just type.'

/** What the visitor sees for a photo chosen in the greeting. */
const PHOTO_TEXT = 'Here is my photo.'

const RUN_ID_HEADER = 'x-workflow-run-id'

/** Sent beside the next request's messages, once, and never kept in them. */
type Extras = { photo?: string; email?: string; code?: string }

const isClientTool = (name: string): name is ClientTool => (CLIENT_TOOLS as readonly string[]).includes(name)
const toolName = (part: { type: string }) => part.type.slice('tool-'.length)

/** Whether the last message has widgets and none of them is still open. */
function noWidgetOpen(messages: ChatMessage[]): boolean {
  const last = messages.at(-1)
  return (
    last?.role === 'assistant' &&
    last.parts.some((part) => isToolUIPart(part) && isClientTool(toolName(part))) &&
    !last.parts.some((part) => isToolUIPart(part) && isClientTool(toolName(part)) && part.state === 'input-available')
  )
}

function useTransport(
  runId: RefObject<string | null>,
  extras: RefObject<Extras>,
  answered: RefObject<boolean>,
) {
  const [transport] = useState(
    () =>
      new WorkflowChatTransport<ChatMessage>({
        api: '/api/testimonials/chat',
        onChatSendMessage: (response) => {
          runId.current = response.headers.get(RUN_ID_HEADER) ?? runId.current
        },
        prepareSendMessagesRequest: ({ messages }) => {
          const sent = extras.current
          extras.current = {}
          answered.current = false
          return runId.current
            ? { api: `/api/testimonials/chat/${runId.current}/message`, body: { messages, ...sent } }
            : { api: '/api/testimonials/chat', body: { messages } }
        },
        prepareReconnectToStreamRequest: ({ api }) => ({
          api: runId.current ? `/api/testimonials/chat/${runId.current}/stream` : api,
        }),
      }),
  )
  return transport
}

/** A finished answer to a widget, as the conversation shows it afterwards. */
function answered(name: ClientTool, output: unknown): string | null {
  const value = output as Record<string, unknown> | undefined
  if (!value || value.visitorTypedInstead) return null
  switch (name) {
    case 'askPhoto':
      return 'Photo uploaded'
    case 'confirmProduct':
      return 'Product confirmed'
    case 'askName':
      return `Name: ${String(value.name)}`
    case 'reviewQuote':
      return 'Quote approved'
    case 'askConsent':
      return 'Consent given'
    case 'askEmail':
      return 'Email address given'
    case 'askCode':
      return value.resend ? 'New code requested' : 'Code entered'
  }
}

/**
 * The testimonial conversation: messages on the left, the draft card on the
 * right, a one-line bar above the messages on small screens. `useChat`'s id is
 * the run id once there is a run, and the transport reconnects to the run's
 * current turn after a reload. Only the last assistant message renders open
 * widgets; earlier ones show what was answered.
 */
export function Chat({
  initial,
  products,
  onRestart,
}: {
  initial: CurrentChat
  products: ChatProduct[]
  onRestart: () => void
}) {
  const runId = useRef<string | null>(initial?.runId ?? null)
  const extras = useRef<Extras>({})
  // `useChat` asks `sendAutomaticallyWhen` after every response too, when
  // the last message still holds the answered widgets; only a new answer sends.
  const answeredWidget = useRef(false)
  const transport = useTransport(runId, extras, answeredWidget)
  const [draft, setDraft] = useState<DraftView | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [text, setText] = useState('')
  const list = useRef<HTMLOListElement>(null)

  const onData: ChatOnDataCallback<ChatMessage> = (part) => {
    if (part.type === 'data-draft') setDraft(part.data)
  }
  const { messages, sendMessage, addToolOutput, status, error } = useChat<ChatMessage>({
    ...(initial ? { id: initial.runId, messages: initial.messages } : {}),
    resume: initial !== null,
    transport,
    sendAutomaticallyWhen: ({ messages }) => answeredWidget.current && noWidgetOpen(messages),
    onData,
  })

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo)
  }, [photo])

  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [messages, status])

  const busy = status === 'submitted' || status === 'streaming'
  const ended = draft?.submitted === true || /\b410\b/.test(error?.message ?? '')

  function keepPhoto(pathname: string, jpeg: Blob) {
    runId.current ??= runOfPathname(pathname)
    setPhoto(URL.createObjectURL(jpeg))
    return pathname
  }

  function answer(toolCallId: string, tool: ClientTool, output: unknown, sent?: Extras) {
    if (sent) extras.current = sent
    answeredWidget.current = true
    void addToolOutput({ tool, toolCallId, output } as never)
  }

  const currentRun = () => runId.current
  const lastAssistant = messages.map((message) => message.role).lastIndexOf('assistant')

  return (
    <div className="flex flex-col gap-4">
      <DraftBar draft={draft} photo={photo} products={products} />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-h-80 flex-col gap-4">
          <ol ref={list} aria-live="polite" className="flex flex-col gap-4">
            <li className="max-w-prose text-pretty">{GREETING}</li>
            {messages.length === 0 ? (
              <li>
                <PhotoWidget
                  runId={currentRun}
                  attemptsLeft={MAX_PHOTO_ATTEMPTS}
                  onUploaded={(pathname, jpeg) => {
                    extras.current = { photo: keepPhoto(pathname, jpeg) }
                    void sendMessage({ text: PHOTO_TEXT })
                  }}
                />
              </li>
            ) : null}
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <li key={message.id} className="max-w-prose self-end rounded-lg bg-bg-secondary px-3 py-2 text-pretty">
                  {message.parts.map((part, i) => (part.type === 'text' ? <span key={i}>{part.text}</span> : null))}
                </li>
              ) : (
                <li key={message.id} className="flex max-w-prose flex-col gap-3">
                  {message.parts.map((part, i) => {
                    if (part.type === 'text') return <p key={i} className="text-pretty">{part.text}</p>
                    if (!isToolUIPart(part)) return null
                    const name = toolName(part)
                    if (!isClientTool(name)) return null
                    if (part.state === 'output-available') {
                      const summary = answered(name, part.output)
                      return summary ? (
                        <p key={i} className="text-sm text-fg-secondary">
                          {summary}
                        </p>
                      ) : null
                    }
                    if (part.state !== 'input-available' || index !== lastAssistant || busy || ended) return null
                    const id = part.toolCallId
                    switch (name) {
                      case 'askPhoto':
                        return (
                          <PhotoWidget
                            key={i}
                            runId={currentRun}
                            attemptsLeft={draft?.photoAttemptsLeft ?? MAX_PHOTO_ATTEMPTS}
                            onUploaded={(pathname, jpeg) => answer(id, name, { pathname: keepPhoto(pathname, jpeg) })}
                          />
                        )
                      case 'confirmProduct':
                        return (
                          <ConfirmWidget
                            key={i}
                            candidates={draft?.candidates ?? []}
                            products={products}
                            onConfirm={(productId) => answer(id, name, { productId, others: [] })}
                          />
                        )
                      case 'askName':
                        return <NameWidget key={i} onSubmit={(value) => answer(id, name, { name: value })} />
                      case 'reviewQuote': {
                        const input = part.input as { text?: unknown } | undefined
                        const suggested = typeof input?.text === 'string' ? input.text : ''
                        return <QuoteWidget key={i} text={suggested} onSubmit={(quote) => answer(id, name, { quote })} />
                      }
                      case 'askConsent':
                        return <ConsentWidget key={i} onSubmit={() => answer(id, name, { consent: true })} />
                      case 'askEmail':
                        return <EmailWidget key={i} onSubmit={(email) => answer(id, name, { provided: true }, { email })} />
                      case 'askCode':
                        return (
                          <CodeWidget
                            key={i}
                            onSubmit={(code) => answer(id, name, { entered: true }, { code })}
                            onResend={() => answer(id, name, { resend: true })}
                          />
                        )
                    }
                  })}
                </li>
              ),
            )}
            {status === 'submitted' ? (
              <li className="flex items-center gap-2 text-sm text-fg-secondary">
                <Spinner /> Thinking…
              </li>
            ) : null}
          </ol>
          {ended ? (
            <div className="flex flex-col items-start gap-3">
              {draft?.submitted ? null : <p>This conversation has ended.</p>}
              <Button variant="outline" size="lg" className="px-4" onClick={onRestart}>
                Start another testimonial
              </Button>
            </div>
          ) : (
            <>
              {status === 'error' ? (
                <p role="alert" className="text-sm text-danger">
                  Something went wrong. Send your message again.
                </p>
              ) : null}
              <form
                className="mt-auto flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  const message = text.trim()
                  if (!message || busy) return
                  void sendMessage({ text: message })
                  setText('')
                }}
              >
                <Input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={MESSAGE_MAX_LENGTH}
                  aria-label="Message"
                  placeholder="Type a message"
                  className="h-9"
                />
                <Button type="submit" size="lg" className="px-4" disabled={busy || text.trim() === ''}>
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <DraftCard draft={draft} photo={photo} products={products} />
          </div>
        </aside>
      </div>
    </div>
  )
}
