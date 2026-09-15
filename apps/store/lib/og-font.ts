import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** The font family `next/og` markup uses; `loadOgFonts` registers it. */
export const OG_FONT_FAMILY = 'Geist'

const FONT_PATH = join(
  process.cwd(),
  'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf',
)
let geist: Promise<Buffer> | undefined

/**
 * The `fonts` option for `next/og` image routes: Geist Regular. Call it inside
 * the image handler, never at module scope: image modules sit in every route's
 * graph through the metadata, and a route that resumes at request time loads
 * them on the server, where a module-scope read of a file outside the function
 * bundle threw ENOENT and replaced the page with the error boundary
 * (specs/callout.md). Every route that calls this is listed in
 * `outputFileTracingIncludes`. The file is read once per process; a failed
 * read is forgotten so the next call retries.
 */
export async function loadOgFonts() {
  geist ??= readFile(FONT_PATH).catch((error: unknown) => {
    geist = undefined
    throw error
  })
  return [
    {
      name: OG_FONT_FAMILY,
      data: await geist,
      style: 'normal' as const,
      weight: 400 as const,
    },
  ]
}
