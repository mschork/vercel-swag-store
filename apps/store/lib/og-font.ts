import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const FONT_PATH = join(
  process.cwd(),
  'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf',
)
let geist: Promise<Buffer> | undefined

/**
 * Geist Regular for `next/og` image routes. Call it inside the image handler,
 * never at module scope: image modules sit in every route's graph through the
 * metadata, and a route that resumes at request time loads them on the server,
 * where a module-scope read of a file outside the function bundle threw ENOENT
 * and replaced the page with the error boundary (specs/callout.md). Every
 * route that calls this is listed in `outputFileTracingIncludes`. The read is
 * shared per process; a failed read is forgotten so the next call retries.
 */
export function loadGeist(): Promise<Buffer> {
  geist ??= readFile(FONT_PATH).catch((error: unknown) => {
    geist = undefined
    throw error
  })
  return geist
}
