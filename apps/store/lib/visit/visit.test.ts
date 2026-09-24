import { describe, expect, it } from 'vitest'
import { afterOrder } from './visit'

describe('afterOrder', () => {
  it('takes each line off the draw it came from', () => {
    const after = afterOrder({ bottle_001: 14, pin_001: 3 }, [
      { productId: 'bottle_001', quantity: 4 },
      { productId: 'pin_001', quantity: 3 },
    ])
    expect(after).toEqual({ bottle_001: 10, pin_001: 0 })
  })

  it('never goes below nothing', () => {
    expect(afterOrder({ bottle_001: 2 }, [{ productId: 'bottle_001', quantity: 9 }])).toEqual({
      bottle_001: 0,
    })
  })

  it('answers the whole map, leaving products without a line alone', () => {
    const after = afterOrder({ bottle_001: 5, mug_001: 7 }, [
      { productId: 'bottle_001', quantity: 1 },
    ])
    expect(after).toEqual({ bottle_001: 4, mug_001: 7 })
  })

  it('ignores a line the visit has no draw for', () => {
    const after = afterOrder({ bottle_001: 5 }, [{ productId: 'unknown_001', quantity: 1 }])
    expect(after).toEqual({ bottle_001: 5 })
  })

  it('leaves the map it was given unchanged', () => {
    const stock = { bottle_001: 5 }
    afterOrder(stock, [{ productId: 'bottle_001', quantity: 2 }])
    expect(stock).toEqual({ bottle_001: 5 })
  })
})
