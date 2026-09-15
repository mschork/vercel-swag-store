import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuantityStepper } from './quantity-stepper'

type Props = Parameters<typeof QuantityStepper>[0]

/**
 * Server-renders the stepper and returns the opening tag of the element whose
 * attributes contain `marker`. Vitest runs in Node without a DOM, so this checks
 * the rendered state; the clamping rules themselves are tested in lib/quantity.
 */
function tagOf(props: Partial<Props>, marker: string): string {
  const html = renderToStaticMarkup(
    <QuantityStepper name="quantity" min={1} max={5} {...props} />,
  )
  const tag = html.match(new RegExp(`<[^>]*${marker}[^>]*>`))?.[0]
  if (!tag) throw new Error(`No element with ${marker} in ${html}`)
  return tag
}

/** React renders a true boolean attribute as `name=""`; class names like `disabled:opacity-50` do not match. */
const has = (tag: string, attribute: string) => tag.includes(` ${attribute}=""`)

const plus = (props: Partial<Props>) =>
  tagOf(props, 'aria-label="Increase quantity"')
const minus = (props: Partial<Props>) =>
  tagOf(props, 'aria-label="Decrease quantity"')
const input = (props: Partial<Props>) => tagOf(props, 'type="number"')

describe('QuantityStepper', () => {
  it('disables plus at max and minus at min', () => {
    expect(has(plus({ defaultValue: 5 }), 'disabled')).toBe(true)
    expect(has(minus({ defaultValue: 5 }), 'disabled')).toBe(false)
    expect(has(minus({ defaultValue: 1 }), 'disabled')).toBe(true)
    expect(has(plus({ defaultValue: 1 }), 'disabled')).toBe(false)
  })

  it('clamps the value to [min, max]', () => {
    expect(input({ defaultValue: 9 })).toContain('value="5"')
    expect(input({ defaultValue: 0 })).toContain('value="1"')
    expect(has(plus({ defaultValue: 9 }), 'disabled')).toBe(true)
  })

  it('puts the range on the native input so the browser enforces it without JavaScript', () => {
    const tag = input({})
    expect(tag).toContain('name="quantity"')
    expect(tag).toContain('min="1"')
    expect(tag).toContain('max="5"')
    expect(has(tag, 'required')).toBe(true)
  })

  it('shows the default value it is given', () => {
    expect(input({ defaultValue: 3 })).toContain('value="3"')
  })

  it('marks controls aria-disabled while pending but keeps them focusable', () => {
    const props = { defaultValue: 3, pending: true }
    expect(plus(props)).toContain('aria-disabled="true"')
    expect(has(plus(props), 'disabled')).toBe(false)
    expect(minus(props)).toContain('aria-disabled="true"')
    expect(has(input(props), 'readOnly')).toBe(true)
    expect(has(input(props), 'disabled')).toBe(false)
    expect(plus({ defaultValue: 3 })).not.toContain('aria-disabled')
  })

  it('disables every control when disabled, and keeps a valid range when stock is zero', () => {
    const props = { max: 0, disabled: true }
    expect(has(input(props), 'disabled')).toBe(true)
    expect(input(props)).toContain('max="1"')
    expect(input(props)).toContain('value="1"')
    expect(has(plus(props), 'disabled')).toBe(true)
    expect(has(minus(props), 'disabled')).toBe(true)
  })
})
