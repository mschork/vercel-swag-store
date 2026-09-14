import Link from 'next/link'

/** The Vercel triangle geometry, shared with the OG image. */
export const TRIANGLE_VIEWBOX = '0 0 76 65'
export const TRIANGLE_PATH = 'M37.5274 0L75.0548 65H0L37.5274 0Z'

/** Inline so it needs no request and follows `currentColor`. */
function Triangle() {
  return (
    <svg aria-hidden="true" viewBox={TRIANGLE_VIEWBOX} width="24" height="24" fill="currentColor">
      <path d={TRIANGLE_PATH} />
    </svg>
  )
}

/** Header logo: triangle plus the store name; the name is hidden below 640px. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-medium" aria-label="Vercel Swag Store, home">
      <Triangle />
      <span className="hidden sm:inline">Vercel Swag Store</span>
    </Link>
  )
}
