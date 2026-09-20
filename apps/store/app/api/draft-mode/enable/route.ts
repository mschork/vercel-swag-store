import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { draftClient } from '@/lib/sanity/draft-client'

/**
 * Switches draft mode on for an editor. `defineEnableDraftMode` accepts only
 * the short-lived secret the Studio's Presentation tool mints, and checks it
 * against Sanity with the read token, so a stranger cannot call this. In a
 * cross-site iframe it sets the cookies `Partitioned`.
 *
 * Without the token the feature is off and the route does not exist as far as
 * a caller can tell, so previews, CI and forks are unaffected.
 */
export const GET = draftClient
  ? defineEnableDraftMode({ client: draftClient }).GET
  : () => new Response('Not found', { status: 404 })
