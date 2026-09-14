import { z } from 'zod'

/**
 * Client-safe environment: only `NEXT_PUBLIC_*` variables, each read with a
 * literal `process.env.NEXT_PUBLIC_…` access so Next can inline it at build
 * time. Safe to import from client components; contains no secret.
 */
const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

export const publicEnv: PublicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
})
