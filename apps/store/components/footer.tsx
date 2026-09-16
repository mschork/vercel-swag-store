import { cacheLife } from 'next/cache'
import { getStoreConfig } from '@/lib/api/store'
import { loadOptional } from '@/lib/load-optional'
import { socialLinks } from '@/lib/social-links'
import { Container } from './container'

/**
 * The year is computed on the server inside a cached component so the shell
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
  const config = await loadOptional('Footer: store config', getStoreConfig)
  if (!config) return null
  const links = socialLinks(config.socialLinks)
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

/** Full width with a hairline above, mirroring the header (E10). */
export function Footer() {
  return (
    <footer className="mt-12 border-t border-border text-sm text-fg-secondary md:mt-16">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © <CopyrightYear /> Vercel Swag Store
        </p>
        <SocialLinks />
      </Container>
    </footer>
  )
}
