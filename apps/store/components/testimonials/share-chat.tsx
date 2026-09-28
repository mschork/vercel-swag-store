'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useSyncExternalStore } from 'react'
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

/** The session's conversation still going; `null` for none or a failed read. */
function requestCurrentChat(): Promise<CurrentChat> {
  return fetch('/api/testimonials/chat')
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
 * rather than after it, and forgets it when the chat closes, so opening it
 * again reads the conversation again.
 */
function readOpening(): Opening {
  const open = window.location.hash === SHARE_HASH
  if (open !== opening.open) opening = open ? { open, chat: requestCurrentChat() } : CLOSED
  return opening
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
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

  function close() {
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
      onPointerEnter={preloadPanel}
      onFocus={preloadPanel}
      onTouchStart={preloadPanel}
      className={buttonVariants({ size: 'lg', className: 'self-start px-4' })}
    >
      {label}
    </a>
  )
}
