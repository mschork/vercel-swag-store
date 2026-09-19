import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ applyDecision: vi.fn(), createClient: vi.fn(() => ({ id: 'client' })) }))
vi.mock('@sanity/client', () => ({ createClient: mocks.createClient }))
vi.mock('@repo/demand', () => ({ applyDecision: mocks.applyDecision }))

const { handler } = await import('./index.ts')

type Args = Parameters<typeof handler>[0]
const call = (status: string, local = false) =>
  handler({
    context: { local, clientOptions: { projectId: 'p', dataset: 'production', token: 't' } },
    event: { data: { _id: 'productIdea.x', status } },
  } as unknown as Args)

beforeEach(() => {
  mocks.applyDecision.mockReset().mockResolvedValue('applied')
  mocks.createClient.mockClear()
})

describe('idea-decided', () => {
  it('applies an accepted or rejected status with the Function’s own client', async () => {
    await call('accepted')
    expect(mocks.createClient).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p', token: 't', useCdn: false }))
    expect(mocks.applyDecision).toHaveBeenCalledExactlyOnceWith({ id: 'client' }, { ideaId: 'productIdea.x', decision: 'accepted' })
  })

  it('ignores an idea that is still proposed', async () => {
    await call('proposed')
    expect(mocks.applyDecision).not.toHaveBeenCalled()
  })

  it('writes nothing on a local test run', async () => {
    await call('rejected', true)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('lets a failure surface in the logs', async () => {
    mocks.applyDecision.mockRejectedValue(new Error('No product idea productIdea.x'))
    await expect(call('accepted')).rejects.toThrow('No product idea')
  })
})
