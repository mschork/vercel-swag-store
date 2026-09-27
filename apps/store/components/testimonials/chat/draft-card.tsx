'use client'

import { DRAFT_FACTS, type DraftFact } from '@repo/testimonials/constants'
import type { DraftView } from '@repo/testimonials/draft'
import { useState } from 'react'
import type { ChatProduct } from './types'

const FACT_LABELS: Record<DraftFact, string> = {
  photo: 'Photo',
  product: 'Product',
  name: 'Name',
  quote: 'Quote',
  consent: 'Consent',
  email: 'Verified email',
}

function Check({ done }: { done: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" className={done ? 'text-success' : 'text-border-strong'}>
      {done ? (
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      )}
    </svg>
  )
}

/**
 * The submission as it fills in, from the run's latest `data-draft` part.
 * The photo is the browser's own copy, a `blob:` URL; after a reload there is
 * none, and the card says the photo is in.
 */
export function DraftCard({
  draft,
  photo,
  products,
}: {
  draft: DraftView | null
  photo: string | null
  products: ChatProduct[]
}) {
  const missing = new Set(draft?.missing ?? DRAFT_FACTS)
  const product = products.find((p) => p.id === draft?.product)
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob: URL, which next/image cannot load
        <img src={photo} alt="Your photo" className="aspect-square w-full rounded-sm object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-sm bg-bg-secondary text-sm text-fg-secondary">
          {draft?.photo ? 'Photo uploaded' : 'No photo yet'}
        </div>
      )}
      {product || draft?.name || draft?.quote ? (
        <div className="flex flex-col gap-1">
          {product ? <p className="text-sm font-medium">{product.name}</p> : null}
          {draft?.quote ? <p className="text-sm text-pretty">&ldquo;{draft.quote}&rdquo;</p> : null}
          {draft?.name ? <p className="text-sm text-fg-secondary">{draft.name}</p> : null}
        </div>
      ) : null}
      <ul className="flex flex-col gap-1.5" aria-label="What the testimonial needs">
        {DRAFT_FACTS.map((fact) => (
          <li key={fact} className="flex items-center gap-2 text-sm">
            <Check done={!missing.has(fact)} />
            <span className={missing.has(fact) ? 'text-fg-secondary' : undefined}>{FACT_LABELS[fact]}</span>
            <span className="sr-only">{missing.has(fact) ? ', still needed' : ', done'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** On small screens: the card behind a one-line bar that expands on tap. */
export function DraftBar(props: Parameters<typeof DraftCard>[0]) {
  const [open, setOpen] = useState(false)
  const done = DRAFT_FACTS.length - (props.draft?.missing.length ?? DRAFT_FACTS.length)
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center justify-between rounded-lg border border-border px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>
          Your testimonial · {done} of {DRAFT_FACTS.length}
        </span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open ? <DraftCard {...props} /> : null}
    </div>
  )
}
