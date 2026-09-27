import { describe, expect, it, vi } from 'vitest'
import { carryOut, type DecisionSteps } from './decide'

function recorder(fail: Partial<Record<keyof DecisionSteps, true>> = {}) {
  const calls: string[] = []
  const step = (name: keyof DecisionSteps) =>
    vi.fn(async (...args: unknown[]) => {
      calls.push([name, ...args.map((arg) => JSON.stringify(arg))].join(' '))
      if (fail[name]) throw new Error(`${name} failed`)
    })
  const steps: DecisionSteps = {
    publish: step('publish'),
    sendOutcome: step('sendOutcome'),
    dropPhotos: step('dropPhotos'),
    closeDecision: step('closeDecision'),
  }
  return { calls, steps }
}

describe('carryOut', () => {
  it('publishes an accepted submission before it emails and cleans up', async () => {
    const { calls, steps } = recorder()
    expect(await carryOut({ status: 'accepted', photoAlt: 'A mug' }, steps)).toEqual({ emailed: true })
    expect(calls).toEqual([
      'publish "A mug"',
      'sendOutcome {"status":"accepted","photoAlt":"A mug"}',
      'dropPhotos',
      'closeDecision',
    ])
  })

  it('publishes nothing for a rejection', async () => {
    const { calls, steps } = recorder()
    await carryOut({ status: 'rejected', rejectionReason: 'photo' }, steps)
    expect(calls.map((call) => call.split(' ')[0])).toEqual(['sendOutcome', 'dropPhotos', 'closeDecision'])
  })

  it('cleans up when the email fails', async () => {
    const { calls, steps } = recorder({ sendOutcome: true })
    expect(await carryOut({ status: 'rejected', rejectionReason: 'other' }, steps)).toEqual({ emailed: false })
    expect(calls.slice(1)).toEqual(['dropPhotos', 'closeDecision'])
  })

  it('stops with the photo kept when the publish fails', async () => {
    const { calls, steps } = recorder({ publish: true })
    await expect(carryOut({ status: 'accepted', photoAlt: 'A mug' }, steps)).rejects.toThrow('publish failed')
    expect(calls).toEqual(['publish "A mug"'])
  })
})
