'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Shown when the results fail to render: the API is down, or a call threw.
 * "Try again" refetches this route's dynamic content and clears the boundary
 * in the same transition, so the grid comes back without a full reload and
 * the form keeps its value.
 */
export function ResultsError({ onReset }: { onReset: () => void }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="text-fg-secondary">Search is unavailable right now.</p>
      <Button
        type="button"
        size="lg"
        className="h-10 px-4"
        disabled={isPending}
        onClick={() =>
          start(() => {
            router.refresh()
            onReset()
          })
        }
      >
        Try again
      </Button>
    </div>
  )
}
