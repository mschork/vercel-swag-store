import 'server-only'

const REQUIRED = ['API_BASE_URL', 'API_BYPASS_TOKEN'] as const

type RequiredKey = (typeof REQUIRED)[number]

export type ServerEnv = Record<RequiredKey, string>

/**
 * Throws with a clear message if a required server variable is missing.
 * Called from `instrumentation.ts` so the server fails at startup rather than
 * on the first request that needs the API.
 */
export function assertServerEnv(): ServerEnv {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy apps/store/.env.example to apps/store/.env.local and fill them in.',
    )
  }
  return {
    API_BASE_URL: process.env.API_BASE_URL as string,
    API_BYPASS_TOKEN: process.env.API_BYPASS_TOKEN as string,
  }
}
