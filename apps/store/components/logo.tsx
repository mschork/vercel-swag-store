import Link from 'next/link'

/** The Vercel triangle, inline so it needs no request and follows `currentColor`. */
export function Triangle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 76 65"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  )
}

/** Header logo: triangle plus the store name; the name is hidden below 640px. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-medium" aria-label="Vercel Swag Store, home">
      <Triangle className="h-5 w-5 sm:h-6 sm:w-6" />
      <span className="hidden sm:inline">Vercel Swag Store</span>
    </Link>
  )
}
