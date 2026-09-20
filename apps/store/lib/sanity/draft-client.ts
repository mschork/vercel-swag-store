import 'server-only'
import { serverEnv } from '@/lib/env'
import { sanityClient } from './client'

/**
 * The client an editor's draft-mode request reads with: the Viewer token, the
 * `drafts` perspective, and stega on, so every string carries an invisible
 * pointer to the field that holds it and the overlay can open that field on
 * click. `null` without the token, which switches the feature off.
 *
 * The token is server-only: this module is never imported from a client
 * component and the token is never logged. It can read the private demand
 * documents; no query in the store asks for them
 * (docs/adr/0005-draft-mode-read-token.md).
 *
 * `studioUrl` only matters outside Presentation, where the overlay links to a
 * Studio instead of messaging the one framing it: the first allowed origin,
 * or the local Studio when none is set.
 */
const token = serverEnv.SANITY_API_READ_TOKEN
const studioUrl = serverEnv.PRESENTATION_STUDIO_ORIGINS[0] ?? 'http://localhost:3333'

export const draftClient = token
  ? sanityClient.withConfig({
      token,
      perspective: 'drafts',
      useCdn: false,
      stega: { enabled: true, studioUrl },
    })
  : null
