export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importing the module runs the zod parse; it throws if the env is invalid.
    await import('./lib/env')
  }
}
