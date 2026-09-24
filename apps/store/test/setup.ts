import { vi } from 'vitest'

// Cached data functions call these from `next/cache`, which exists only
// inside the Next runtime. Stubbing them lets tests call the same functions
// the app calls.
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
  refresh: vi.fn(),
}))

// `lib/env.ts` parses at module load. Give unit tests a valid environment when
// none is loaded from .env.local; the opt-in integration test needs the real one.
process.env.API_BASE_URL ??= 'https://api.test/api'
process.env.API_BYPASS_TOKEN ??= 'test-bypass-token'
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project'
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset'

// Unit tests keep sessions in memory, even when .env.local names a Redis.
delete process.env.KV_REST_API_URL
delete process.env.KV_REST_API_TOKEN
