'use client'
/* eslint-disable react-hooks/refs -- spike: refs are read only in transport callbacks */

import { useChat } from '@ai-sdk/react'
import { WorkflowChatTransport } from '@ai-sdk/workflow/client'
import { lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'

type Current = { runId: string; messages: UIMessage[] } | null

export function SpikeChatLoader() {
  const [current, setCurrent] = useState<Current | undefined>(undefined)
  useEffect(() => {
    fetch('/api/testimonials/chat/current')
      .then((r) => r.json())
      .then((c: Current) => setCurrent(c))
  }, [])
  if (current === undefined) return <p>Loading…</p>
  return <SpikeChat initial={current} />
}

function SpikeChat({ initial }: { initial: Current }) {
  const runId = useRef<string | null>(initial?.runId ?? null)
  const pendingEmail = useRef<string | null>(null)
  const [draft, setDraft] = useState<unknown>(null)
  const [log, setLog] = useState<string[]>([])
  const note = (s: string) => setLog((l) => [...l, `${new Date().toISOString().slice(11, 23)} ${s}`])

  const transport = useMemo(
    () =>
      new WorkflowChatTransport<UIMessage>({
        api: '/api/testimonials/chat',
        onChatSendMessage: (res) => {
          runId.current = res.headers.get('x-workflow-run-id')
          note(`sent, run ${runId.current}`)
        },
        onChatEnd: ({ chunkIndex }) => note(`turn ended after ${chunkIndex} chunks`),
        prepareSendMessagesRequest: ({ messages }) => {
          const email = pendingEmail.current
          pendingEmail.current = null
          return runId.current
            ? { api: `/api/testimonials/chat/${runId.current}/message`, body: { messages, ...(email ? { email } : {}) } }
            : { api: '/api/testimonials/chat', body: { messages } }
        },
      }),
    [],
  )

  const { messages, sendMessage, addToolOutput, status } = useChat({
    id: initial?.runId,
    messages: initial?.messages ?? [],
    resume: initial !== null,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onData: (part) => {
      if (part.type === 'data-draft') setDraft(part.data)
    },
  })
  const [text, setText] = useState('')
  useEffect(() => {
    ;(window as unknown as { __messages: UIMessage[] }).__messages = messages
  }, [messages])

  return (
    <div className="space-y-3">
      <p data-testid="status">status: {status}</p>
      <pre data-testid="draft">draft: {JSON.stringify(draft)}</pre>
      <ol className="space-y-2">
        {messages.map((m, mi) => (
          <li key={m.id} data-role={m.role}>
            <b>{m.role}</b>{' '}
            {m.parts.map((p, i) => {
              if (p.type === 'text') return <span key={i}>{p.text}</span>
              if (p.type.startsWith('tool-') && 'toolCallId' in p) {
                const name = p.type.slice(5)
                if (mi === messages.length - 1 && p.state === 'input-available' && (name === 'askName' || name === 'askEmail')) {
                  return (
                    <form
                      key={i}
                      data-testid={`widget-${name}`}
                      onSubmit={(e) => {
                        e.preventDefault()
                        const value = new FormData(e.currentTarget).get('v') as string
                        if (name === 'askEmail') {
                          pendingEmail.current = value
                          addToolOutput({ tool: name, toolCallId: p.toolCallId, output: { email: value } })
                        } else {
                          addToolOutput({ tool: name, toolCallId: p.toolCallId, output: { name: value } })
                        }
                      }}
                    >
                      <input name="v" aria-label={name} className="border" />
                      <button type="submit">OK</button>
                    </form>
                  )
                }
                return (
                  <code key={i} className="block text-xs">
                    [{name} {p.state} {'output' in p ? JSON.stringify(p.output) : ''}]
                  </code>
                )
              }
              return null
            })}
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage({ text })
          setText('')
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="message" className="border" />
        <button type="submit" disabled={status !== 'ready'}>Send</button>
      </form>
      <pre data-testid="log" className="text-xs">{log.join('\n')}</pre>
    </div>
  )
}
