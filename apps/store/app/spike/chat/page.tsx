import { SpikeChatLoader } from './spike-chat'

/** Spike: a bare chat against one testimonial run. Throwaway. */
export default function SpikeChatPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1>Testimonial chat spike</h1>
      <SpikeChatLoader />
    </main>
  )
}
