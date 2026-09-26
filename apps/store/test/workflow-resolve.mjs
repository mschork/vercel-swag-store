// Resolves `next/*` subpaths for the workflow bundles that Node's own ESM
// loader imports in integration tests; Next has no `exports` map, and
// `next/cache` works only inside the Next runtime, so it maps to a stub.
const stub = new URL('./next-cache-stub.mjs', import.meta.url).href

export async function resolve(specifier, context, next) {
  if (specifier === 'next/cache') return { url: stub, shortCircuit: true }
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context)
  return next(specifier, context)
}

