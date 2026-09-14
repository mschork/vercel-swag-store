'use client'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="flex flex-col gap-4 py-12">
      <h1 className="text-2xl font-medium">Something went wrong</h1>
      <p className="text-fg-secondary">
        The page could not be rendered.
        {error.digest ? <span className="font-mono"> Reference {error.digest}.</span> : null}
      </p>
      <p>
        <button
          type="button"
          onClick={retry}
          className="rounded-sm border border-border-strong px-3 py-2 text-sm hover:bg-bg-secondary"
        >
          Try again
        </button>
      </p>
    </section>
  )
}
