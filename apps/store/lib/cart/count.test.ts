import { describe, expect, it } from 'vitest'
import { confirmedAfter, shownCount, type CountSources } from './count'

const idle: CountSources = { server: 2, confirmed: undefined, adding: 0, cartPage: null }

describe('shownCount', () => {
  it('shows the server count until the client confirms one', () => {
    expect(shownCount(idle)).toBe(2)
    expect(shownCount({ ...idle, confirmed: 5 })).toBe(5)
  })

  it('runs ahead by the items of an add in flight', () => {
    expect(shownCount({ ...idle, adding: 3 })).toBe(5)
    expect(shownCount({ ...idle, confirmed: 5, adding: 1 })).toBe(6)
  })

  it('shows no number when nothing was read or confirmed', () => {
    expect(shownCount({ ...idle, server: undefined })).toBeNull()
    expect(shownCount({ ...idle, server: undefined, confirmed: 4 })).toBe(4)
  })

  it('shows no number while the count is unknown, even during an add', () => {
    expect(shownCount({ ...idle, server: null })).toBeNull()
    expect(shownCount({ ...idle, server: null, adding: 2 })).toBeNull()
    expect(shownCount({ ...idle, confirmed: null, adding: 2 })).toBeNull()
  })

  it('follows the open cart page over everything else', () => {
    expect(shownCount({ ...idle, confirmed: 5, cartPage: 7 })).toBe(7)
    expect(shownCount({ ...idle, server: null, cartPage: 0 })).toBe(0)
  })
})

describe('confirmedAfter', () => {
  it('takes the count a successful action reports', () => {
    expect(confirmedAfter(2, { totalItems: 3 })).toBe(3)
    expect(confirmedAfter(undefined, { totalItems: 1 })).toBe(1)
  })

  it('takes the count a failed action read, such as an expired cart', () => {
    expect(confirmedAfter(4, { totalItems: 0 })).toBe(0)
  })

  it('keeps the confirmed count when a failed action reports none', () => {
    expect(confirmedAfter(4, {})).toBe(4)
    expect(confirmedAfter(undefined, null)).toBeUndefined()
  })

  it('reconciles to the server after an add fails: the in-flight items drop away', () => {
    const during = shownCount({ ...idle, confirmed: 2, adding: 1 })
    const after = shownCount({ ...idle, confirmed: confirmedAfter(2, {}), adding: 0 })
    expect([during, after]).toEqual([3, 2])
  })
})
