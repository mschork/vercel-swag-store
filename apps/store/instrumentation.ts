import { registerOTel } from '@vercel/otel'

export async function register() {
  // Traces go to the Vercel project's Observability tab; `fetchApi` adds one
  // span per API call with its path and cache policy.
  registerOTel({ serviceName: 'vercel-swag-store' })
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importing the module runs the zod parse; it throws if the env is invalid.
    await import('./lib/env')
  }
}
