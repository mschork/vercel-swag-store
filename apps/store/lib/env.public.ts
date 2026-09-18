import { z } from 'zod'

/**
 * Client-safe environment: only `NEXT_PUBLIC_*` variables, each read with a
 * literal `process.env.NEXT_PUBLIC_…` access so Next can inline it at build
 * time. Safe to import from client components; contains no secret.
 * `lib/env.ts` extends this schema for the server.
 */
export const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

/** Raw public values; empty strings count as unset so the defaults apply. */
export function readPublicEnv() {
  return {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || undefined,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET || undefined,
  }
}

export const publicEnv: PublicEnv = PublicEnvSchema.parse(readPublicEnv())
