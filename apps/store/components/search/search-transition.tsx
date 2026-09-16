'use client'

import { createContext, use, useTransition } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { ResultsError } from './results-error'

interface SearchTransition {
  isPending: boolean
  /** Runs a navigation inside the transition the results region reports on. */
  start: (navigate: () => void) => void
}

/**
 * The form and the results grid are siblings, so the pending state they share
 * travels through a context rather than props. Default: not pending, and a
 * plain call, so the form still works if it is ever rendered outside.
 */
const TransitionContext = createContext<SearchTransition>({
  isPending: false,
  start: (navigate) => navigate(),
})

export const useSearchTransition = () => use(TransitionContext)

/**
 * Owns the one `useTransition` of the search page. `useFormStatus` cannot do
 * this job: with `next/form` and a string `action`, submitting is a client
 * navigation that no form action ever sees, and the debounced path does not
 * submit the form at all.
 *
 * Server components passed as `children` are rendered on the server and
 * prerendered as usual; this wrapper adds no data of its own.
 */
export function SearchTransition({ children }: { children: React.ReactNode }) {
  const [isPending, start] = useTransition()
  return (
    <TransitionContext.Provider value={{ isPending, start }}>
      {children}
    </TransitionContext.Provider>
  )
}

/**
 * The results region: marked `aria-busy` while a search is in flight, and the
 * scope of the error boundary, so a failed results render leaves the form
 * usable and never reaches `app/error.tsx`.
 */
export function SearchResultsRegion({
  children,
}: {
  children: React.ReactNode
}) {
  const { isPending } = useSearchTransition()
  return (
    <section
      aria-label="Search results"
      aria-busy={isPending || undefined}
      className="flex flex-col gap-6"
    >
      <ErrorBoundary
        fallback={(reset) => <ResultsError onReset={reset} />}
      >
        {children}
      </ErrorBoundary>
    </section>
  )
}
