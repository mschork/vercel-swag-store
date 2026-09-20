'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useVisit } from './visit-provider'

/**
 * Throws the visitor's stock and promotion away and draws new ones. The store
 * is a demonstration of an inventory the API cannot keep, and without this the
 * only way to see a restock is to wait a day or open a private window, so the
 * control stays in the footer for everyone rather than behind a flag.
 *
 * It leaves the cart alone: a line that now holds more than its draw is the
 * interesting case, and the cart page says so.
 */
export function ResetVisit() {
  const { reset } = useVisit()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await reset()
            router.refresh()
          })
        }
        className="self-start underline underline-offset-4 hover:text-fg disabled:opacity-50"
      >
        {pending ? 'Drawing…' : 'Reset the demo'}
      </button>
      <p className="text-xs">Draws fresh stock and a fresh promotion. Your cart stays.</p>
    </div>
  )
}
