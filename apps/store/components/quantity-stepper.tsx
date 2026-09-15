'use client'

import { useId, useState } from 'react'
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
 */
export function QuantityStepper({
  name,
  min,
  max,
  defaultValue = min,
  disabled = false,
  label = 'Quantity',
}: {
  name: string
  min: number
  max: number
  defaultValue?: number
  disabled?: boolean
  label?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState(() => String(defaultValue))
  const value = parseQuantity(draft, min, max)
  const shown = draft.trim() === '' ? '' : String(value)
  const { canDecrement, canIncrement } = stepperState(value, min, max)
  const step = (delta: number) =>
    setDraft(String(clampQuantity(value + delta, min, max)))
  const noun = label.toLowerCase()

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm leading-6 text-fg-secondary">
        {label}
      </label>
      <div className="inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          className={STEP_BUTTON}
          onClick={() => step(-1)}
          disabled={disabled || !canDecrement}
          aria-label={`Decrease ${noun}`}
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
          value={shown}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => setDraft(String(value))}
          className="w-12 border-x border-border bg-transparent text-center text-sm tabular-nums [appearance:textfield] disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={STEP_BUTTON}
          onClick={() => step(1)}
          disabled={disabled || !canIncrement}
          aria-label={`Increase ${noun}`}
          aria-controls={id}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <output htmlFor={id} aria-live="polite" className="sr-only">
        {`${label} ${value}`}
      </output>
    </div>
  )
}
