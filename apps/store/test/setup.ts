import { vi } from 'vitest'

// Cached data functions call these from `next/cache`; they exist only inside
// the Next runtime. Stubbing them lets tests call the same functions the app
// calls (see specs/callout.md).
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}))

// `lib/env.ts` parses at module load. Give unit tests a valid environment when
// none is loaded from .env.local; the opt-in integration test needs the real one.
process.env.API_BASE_URL ??= 'https://api.test/api'
process.env.API_BYPASS_TOKEN ??= 'test-bypass-token'
