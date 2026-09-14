import 'server-only'
import { z } from 'zod'

/**
 * Server-side environment, validated once at module load. `instrumentation.ts`
 * imports this module at startup so a missing or malformed variable stops the
 * server before the first request instead of failing inside a render.
 *
 * Sanity variables are added here by E09; E02 validates only what it uses.
 * `API_BYPASS_TOKEN` stays required even while the API is not enforcing
 * Deployment Protection: the documented contract is that it is.
 */
const ServerEnvSchema = z.object({
  API_BASE_URL: z.url(),
  API_BYPASS_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

function parseServerEnv(): ServerEnv {
  const result = ServerEnvSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
    API_BYPASS_TOKEN: process.env.API_BYPASS_TOKEN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  })
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(
      `Invalid server environment: ${problems}. ` +
        'Copy apps/store/.env.example to apps/store/.env.local and fill it in.',
    )
  }
  return result.data
}

export const serverEnv: ServerEnv = parseServerEnv()
