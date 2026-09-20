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
 * The `fonts` option for `next/og`: Geist Regular, read once per process.
 * Call it inside the image handler: a module-scope read runs in every route
 * that imports the image module, where the file is absent from the bundle.
 * Every route that calls this is listed in `outputFileTracingIncludes`.
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
