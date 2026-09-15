'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { clampQuantity, parseQuantity, stepperState } from '@/lib/quantity'

const STEP_BUTTON =
  'flex w-10 items-center justify-center text-lg hover:bg-bg-secondary disabled:pointer-events-none disabled:opacity-50'

/**
 * A native number input between minus and plus buttons. The input carries
 * `name`, `min`, `max` and `required`, so the form submits it and the browser
 * enforces the range even before hydration. With JavaScript the shown value is
 * always clamped to the range (only an empty field is left alone while typing,
 * and blur fills it with the minimum), the buttons disable at the bounds, and a
 * polite live region announces the value, because focus stays on the button
 * that changed it.
 *
 * With `onCommit` the stepper saves as it goes (the cart rows): a minus or plus
 * click commits at once, a typed value on blur or Enter, and a value is never
 * committed twice in a row.
 */
export function QuantityStepper({
  name,
  min,
  max,
  defaultValue = min,
  disabled = false,
  pending = false,
  onCommit,
}: {
  name: string
  min: number
  max: number
  /**
   * The starting quantity. The cart rows pass the line's quantity; when the
   * owner changes it (an optimistic update or its revert) the shown value
   * follows.
   */
  defaultValue?: number
  disabled?: boolean
  /**
   * A commit is being saved: the controls ignore input and are marked
   * `aria-disabled`. Unlike `disabled` they keep focus, so a keyboard user's
   * next press lands on the same button once the save finishes.
   */
  pending?: boolean
  onCommit?: (value: number) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(() => String(defaultValue))
  // Adjusting state when a prop changes, during render rather than in an effect.
  const [followed, setFollowed] = useState(defaultValue)
  if (defaultValue !== followed) {
    setFollowed(defaultValue)
    setDraft(String(defaultValue))
  }
  // The last value handed to `onCommit`, so a blur right after Enter does not
  // save the same value again before the owner re-renders.
  const committed = useRef(defaultValue)
  useEffect(() => {
    committed.current = defaultValue
  }, [defaultValue])

  const value = parseQuantity(draft, min, max)
  const shown = draft.trim() === '' ? '' : String(value)
  const { canDecrement, canIncrement } = stepperState(value, min, max)

  const commit = (next: number) => {
    if (!onCommit || pending || next === committed.current) return
    committed.current = next
    onCommit(next)
  }
  const step = (delta: number) => {
    if (pending) return
    const next = clampQuantity(value + delta, min, max)
    setDraft(String(next))
    commit(next)
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm leading-6 text-fg-secondary">
        Quantity
      </label>
      <div className="inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          className={STEP_BUTTON}
          onClick={() => step(-1)}
          disabled={disabled || !canDecrement}
          aria-disabled={pending || undefined}
          aria-label="Decrease quantity"
          aria-controls={id}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={Math.max(min, max)}
          step={1}
          required
          disabled={disabled}
          readOnly={pending}
          aria-disabled={pending || undefined}
          value={shown}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            setDraft(String(value))
            commit(value)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || !onCommit) return
            event.preventDefault()
            setDraft(String(value))
            commit(value)
          }}
          className="w-12 border-x border-border bg-transparent text-center text-sm tabular-nums [appearance:textfield] disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={STEP_BUTTON}
          onClick={() => step(1)}
          disabled={disabled || !canIncrement}
          aria-disabled={pending || undefined}
          aria-label="Increase quantity"
          aria-controls={id}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <output htmlFor={id} aria-live="polite" className="sr-only">
        {`Quantity ${value}`}
      </output>
    </div>
  )
}
