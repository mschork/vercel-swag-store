import { describe, expect, it } from 'vitest'
import { clampQuantity, parseQuantity, stepperState } from './quantity'

describe('clampQuantity', () => {
  it.each([
    [0, 1],
    [1, 1],
    [3, 3],
    [5, 5],
    [9, 5],
    [-4, 1],
  ])('clamps %i into [1, 5] as %i', (value, expected) => {
    expect(clampQuantity(value, 1, 5)).toBe(expected)
  })

  it('drops fractions', () => {
    expect(clampQuantity(2.9, 1, 5)).toBe(2)
  })

  it('falls back to min for values that are not numbers', () => {
    expect(clampQuantity(Number.NaN, 1, 5)).toBe(1)
    expect(clampQuantity(Number.POSITIVE_INFINITY, 1, 5)).toBe(1)
  })

  it('collapses to min when max is below min (out of stock)', () => {
    expect(clampQuantity(3, 1, 0)).toBe(1)
  })
})

describe('parseQuantity', () => {
  it.each([
    ['', 1],
    ['   ', 1],
    ['abc', 1],
    [' 3 ', 3],
    ['99', 5],
    ['0', 1],
  ])('reads %j as %i within [1, 5]', (raw, expected) => {
    expect(parseQuantity(raw, 1, 5)).toBe(expected)
  })
})

describe('stepperState', () => {
  it('disables minus at min and plus at max', () => {
    expect(stepperState(1, 1, 5)).toEqual({
      canDecrement: false,
      canIncrement: true,
    })
    expect(stepperState(5, 1, 5)).toEqual({
      canDecrement: true,
      canIncrement: false,
    })
    expect(stepperState(3, 1, 5)).toEqual({
      canDecrement: true,
      canIncrement: true,
    })
  })

  it('disables both when the range is a single value', () => {
    expect(stepperState(1, 1, 1)).toEqual({
      canDecrement: false,
      canIncrement: false,
    })
    expect(stepperState(1, 1, 0)).toEqual({
      canDecrement: false,
      canIncrement: false,
    })
  })
})
