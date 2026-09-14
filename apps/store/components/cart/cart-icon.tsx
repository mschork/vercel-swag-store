/**
 * Cart glyph with an optional count badge. `count` null means "unknown"
 * (Suspense fallback or no cart yet); 0 hides the badge.
 */
export function CartIcon({ count }: { count: number | null }) {
  const label = count === null ? 'Cart' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`
  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center" aria-label={label} role="img">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.5 3.5h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6.1" />
        <circle cx="9.5" cy="20" r="1.25" />
        <circle cx="17" cy="20" r="1.25" />
      </svg>
      {count ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-fg px-1 text-center text-[11px] leading-4 font-medium text-bg tabular-nums"
        >
          {count}
        </span>
      ) : null}
    </span>
  )
}
