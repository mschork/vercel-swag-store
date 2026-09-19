import { beforeEach, describe, expect, it, vi } from 'vitest'

const published = { fetch: vi.fn(async () => 'published') }
const draft = { fetch: vi.fn(async () => 'draft') }
const state: { enabled: boolean; draftClient: typeof draft | null } = {
  enabled: false,
  draftClient: draft,
}

vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: state.enabled }),
}))
vi.mock('./client', () => ({ sanityClient: published }))
vi.mock('./draft-client', () => ({
  get draftClient() {
    return state.draftClient
  },
}))

const { sanityFetch } = await import('./fetch')
const call = (stega?: boolean) =>
  sanityFetch<string>({ query: '*[0]', params: { a: 1 }, tags: ['sanity:x'], stega })

beforeEach(() => {
  published.fetch.mockClear()
  draft.fetch.mockClear()
  state.enabled = false
  state.draftClient = draft
})

describe('sanityFetch', () => {
  it('reads published content for a visitor, exactly as before draft mode existed', async () => {
    await expect(call()).resolves.toBe('published')
    expect(published.fetch).toHaveBeenCalledWith('*[0]', { a: 1 })
    expect(draft.fetch).not.toHaveBeenCalled()
  })

  it('reads drafts with stega for an editor in draft mode', async () => {
    state.enabled = true
    await expect(call()).resolves.toBe('draft')
    expect(draft.fetch).toHaveBeenCalledWith('*[0]', { a: 1 }, { stega: true })
    expect(published.fetch).not.toHaveBeenCalled()
  })

  it('honours stega: false for callers that feed machines', async () => {
    state.enabled = true
    await call(false)
    expect(draft.fetch).toHaveBeenCalledWith('*[0]', { a: 1 }, { stega: false })
  })

  it('falls back to published content when draft mode is on but the token is unset', async () => {
    state.enabled = true
    state.draftClient = null
    await expect(call()).resolves.toBe('published')
    expect(draft.fetch).not.toHaveBeenCalled()
  })
})
