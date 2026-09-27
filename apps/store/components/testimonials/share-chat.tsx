'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { SHARE_HASH } from '@/lib/testimonials/share'

/** The panel's code loads only when the chat opens, so the page's first load never carries it. */
const SharePanel = dynamic(() => import('./share-panel').then((module) => module.SharePanel))

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
export function ShareChat({ label }: { label: string }) {
  const open = useSyncExternalStore(
    subscribe,
    () => window.location.hash === SHARE_HASH,
    () => false,
  )
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

  if (open) return <SharePanel onClose={close} />
  return (
    <a ref={link} href={SHARE_HASH} className={buttonVariants({ size: 'lg', className: 'self-start px-4' })}>
      {label}
    </a>
  )
}
