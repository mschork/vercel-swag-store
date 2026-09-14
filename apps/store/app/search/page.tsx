import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Search' }

/** Stub so the header can link here; E07 provides the page. */
export default function SearchPage() {
  return <h1 className="py-12 text-2xl font-medium">Search</h1>
}
