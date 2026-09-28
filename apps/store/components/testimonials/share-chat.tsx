'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react'
import { buttonVariants } from '@/components/ui/button-variants'
import { SHARE_HASH } from '@/lib/testimonials/share'
import type { ChatProduct, CurrentChat } from './chat/types'

const loadPanel = () => import('./share-panel')

/**
 * The panel's code loads only when the chat opens, or when the visitor points
 * at, focuses or touches the link, so the page's first load never carries it.
 */
const SharePanel = dynamic(() => loadPanel().then((module) => module.SharePanel))

const preloadPanel = () => void loadPanel()

/** The last close, which a new opening waits for so it never reads the conversation it ended. */
let ending: Promise<unknown> = Promise.resolve()

/** Ends the session's conversation; `keepalive` lets it finish if the page goes away. */
function endCurrentChat() {
  ending = fetch('/api/testimonials/chat', { method: 'DELETE', keepalive: true }).catch(() => null)
}

/** The session's conversation still going; `null` for none or a failed read. */
function requestCurrentChat(): Promise<CurrentChat> {
  return ending
    .then(() => fetch('/api/testimonials/chat'))
    .then((response) => (response.ok ? (response.json() as Promise<CurrentChat>) : null))
    .catch(() => null)
}

interface Opening {
  open: boolean
  /** The GET started when the fragment turned to `#share`; one per opening. */
  chat: Promise<CurrentChat> | null
}

const CLOSED: Opening = { open: false, chat: null }
let opening = CLOSED

/**
 * Starts the GET when the chat opens, in parallel with the panel's code
 * rather than after it, and forgets it when the chat closes or the link
 * leaves the page, so opening it again reads the conversation again.
 */
function readOpening(): Opening {
  const open = window.location.hash === SHARE_HASH
  if (open !== opening.open) opening = open ? { open, chat: requestCurrentChat() } : CLOSED
  return opening
}

// Back from the entry `openChat` pushes fires `popstate`, which a browser
// need not follow with `hashchange`. While nothing listens, a navigation can
// change the fragment unseen, so the last listener leaving forgets the opening.
let listening = 0
function subscribe(onChange: () => void) {
  listening += 1
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
    listening -= 1
    if (listening === 0) opening = CLOSED
  }
}

/**
 * Opens the chat where the link is. Following the link would scroll `#share`
 * to the top of the window, so a plain click sets the fragment through
 * `pushState`, which does not scroll; Back still closes the chat. A click
 * with a modifier keeps the browser's own behaviour.
 */
function openChat(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  window.history.pushState(window.history.state, '', SHARE_HASH)
  // `pushState` fires no event, and the fragment is what `open` reads.
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/**
 * The link that opens the testimonial chat, and the chat once it is open.
 * The URL's fragment is the only state: the link sets `#share`, and so does
 * every link from elsewhere in the store, so the chat opens on arrival. The
 * server renders the closed state, so the page is the same with or without
 * the fragment until the browser hydrates.
 */
export function ShareChat({ label, products }: { label: string; products: ChatProduct[] }) {
  const { open, chat } = useSyncExternalStore(subscribe, readOpening, () => CLOSED)
  const link = useRef<HTMLAnchorElement>(null)
  const wasOpen = useRef(false)

  // Closing hands focus back to the link that opened the chat.
  useEffect(() => {
    if (wasOpen.current && !open) link.current?.focus()
    wasOpen.current = open
  }, [open])

  /** The Close button: ends the conversation, so the next opening starts afresh. */
  function close() {
    endCurrentChat()
    const { pathname, search } = window.location
    window.history.replaceState(window.history.state, '', `${pathname}${search}`)
    // `replaceState` fires no event, and the fragment is what `open` reads.
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  if (open && chat) return <SharePanel products={products} chat={chat} onClose={close} />
  return (
    <a
      ref={link}
      href={SHARE_HASH}
      onClick={openChat}
      onPointerEnter={preloadPanel}
      onFocus={preloadPanel}
      onTouchStart={preloadPanel}
      className={buttonVariants({ size: 'lg', className: 'self-start px-4' })}
    >
      {label}
    </a>
  )
}
