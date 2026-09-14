import { cacheLife } from 'next/cache'
import { getStoreConfig } from '@/lib/api/store'
import { socialLinks } from '@/lib/social-links'

/**
 * The year is computed on the server inside a cached component so the layout
 * stays prerendered; it may flip up to a day late, which is acceptable.
 */
async function CopyrightYear() {
  'use cache'
  cacheLife('days')
  return <>{new Date().getFullYear()}</>
}

/**
 * Social links from the store config. `app/error.tsx` does not cover the root
 * layout, so a failing config call is caught here: the footer renders without
 * the link row rather than replacing the store with an error screen.
 */
async function SocialLinks() {
  let links
  try {
    links = socialLinks((await getStoreConfig()).socialLinks)
  } catch (error) {
    console.error('Footer: store config unavailable, rendering without social links', error)
    return null
  }
  if (links.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Social links">
      {links.map(({ key, label, href }) => (
        <li key={key}>
          <a href={href} rel="noopener noreferrer" className="hover:text-fg">
            {label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto mt-16 flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-fg-secondary sm:mt-24 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>
        © <CopyrightYear /> Vercel Swag Store
      </p>
      <SocialLinks />
    </footer>
  )
}
