import { cn } from '@/lib/utils'

/**
 * A small ring that turns while something is saving. Decorative: the text
 * beside it says what is happening. Under `prefers-reduced-motion` it stays
 * still, so the label alone carries the wait.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={cn('size-4 animate-spin motion-reduce:animate-none', className)}
    >
      <circle cx="12" cy="12" r="9" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}
