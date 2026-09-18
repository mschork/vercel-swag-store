import 'server-only'
import { z } from 'zod'
import { PublicEnvSchema, readPublicEnv } from './env.public'

/**
 * Server-side environment, validated once at module load. `instrumentation.ts`
 * imports this module at startup so a missing or malformed variable stops the
 * server before the first request instead of failing inside a render.
 *
 * Sanity variables are added here by E09; E02 validates only what it uses.
 * `API_BYPASS_TOKEN` stays required even while the API is not enforcing
 * Deployment Protection: the documented contract is that it is.
 */
const ServerEnvSchema = PublicEnvSchema.extend({
  API_BASE_URL: z.url(),
  API_BYPASS_TOKEN: z.string().min(1),
  // Optional: without it the catalogue revalidation route refuses every call.
  CATALOG_REVALIDATE_SECRET: z.string().min(32).optional(),
  // Optional: without it the Sanity webhook route refuses every call.
  SANITY_REVALIDATE_SECRET: z.string().min(16).optional(),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

function parseServerEnv(): ServerEnv {
  const result = ServerEnvSchema.safeParse({
    ...readPublicEnv(),
    API_BASE_URL: process.env.API_BASE_URL,
    API_BYPASS_TOKEN: process.env.API_BYPASS_TOKEN,
    CATALOG_REVALIDATE_SECRET: process.env.CATALOG_REVALIDATE_SECRET || undefined,
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET || undefined,
  })
  if (!result.success) {
    // prettifyError lists paths and messages only; values are never echoed.
    throw new Error(
      `Invalid server environment:\n${z.prettifyError(result.error)}\n` +
        'Copy apps/store/.env.example to apps/store/.env.local and fill it in.',
    )
  }
  return result.data
}

export const serverEnv: ServerEnv = parseServerEnv()
