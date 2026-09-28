'use client'

import {
  CODE_LENGTH,
  CODE_RESEND_SECONDS,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
} from '@repo/testimonials/constants'
import { useEffect, useId, useRef, useState } from 'react'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { UploadError, reencode, uploadPhoto } from './photo'
import type { ChatProduct } from './types'

/**
 * The widgets the agent asks for facts with, one per client-side tool. Each
 * answers once through its callback; the chat sends the answer to the run.
 */

const field = 'flex flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4'

const UPLOAD_ERRORS: Record<UploadError['reason'], string> = {
  'no-uploads-left': 'No more photos can be uploaded.',
  ended: 'This conversation has ended. Start another one.',
  failed: 'The upload did not work. Try again.',
}

/** The upload button for `askPhoto`. */
export function PhotoWidget({
  runId,
  attemptsLeft,
  onUploaded,
}: {
  /** The run to upload into, read when the photo is chosen. */
  runId: () => string | null
  attemptsLeft: number
  onUploaded: (pathname: string, photo: Blob) => void
}) {
  const [state, setState] = useState<'idle' | 'working' | { error: string }>('idle')
  const input = useRef<HTMLInputElement>(null)
  const id = useId()

  async function choose(file: File | undefined) {
    if (!file) return
    setState('working')
    try {
      const run = runId()
      if (!run) throw new UploadError('failed')
      const jpeg = await reencode(file)
      onUploaded(await uploadPhoto(jpeg, run), jpeg)
    } catch (error) {
      const reason = error instanceof UploadError ? error.reason : 'failed'
      setState({ error: UPLOAD_ERRORS[reason] })
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  if (attemptsLeft === 0) return <p className="text-sm text-fg-secondary">No more photos can be uploaded.</p>
  return (
    <div className={field}>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/*"
        className="peer sr-only"
        disabled={state === 'working'}
        onChange={(event) => choose(event.target.files?.[0])}
      />
      <label
        htmlFor={id}
        className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:cursor-default"
      >
        {state === 'working' ? <Spinner /> : null}
        {state === 'working' ? 'Uploading…' : 'Choose a photo'}
      </label>
      <p className="text-xs text-fg-secondary">
        The store&rsquo;s triangle should be visible. Location data is removed before upload.
      </p>
      {typeof state === 'object' ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </div>
  )
}

function ProductOption({ product }: { product: ChatProduct }) {
  return (
    <span className="flex items-center gap-3">
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail from the API's image host
        <img src={product.image} alt="" width={48} height={48} className="size-12 rounded-sm bg-photo object-contain" />
      ) : null}
      <span className="font-medium">{product.name}</span>
    </span>
  )
}

/** `confirmProduct`: the top candidate with Yes, or the others and the catalogue. */
export function ConfirmWidget({
  candidates,
  products,
  onConfirm,
}: {
  candidates: { id: string; counts: boolean }[]
  products: ChatProduct[]
  onConfirm: (productId: string) => void
}) {
  const known = candidates.flatMap(({ id, counts }) => {
    const product = products.find((p) => p.id === id)
    return product ? [{ product, counts }] : []
  })
  const top = known[0]?.counts ? known[0].product : null
  const [picking, setPicking] = useState(top === null)
  const [picked, setPicked] = useState('')
  const selectId = useId()

  if (top && !picking) {
    return (
      <div className={field}>
        <p className="text-sm text-fg-secondary">Is this the product?</p>
        <ProductOption product={top} />
        <div className="flex flex-wrap gap-2">
          <Button size="lg" className="px-4" onClick={() => onConfirm(top.id)}>
            Yes, that&rsquo;s it
          </Button>
          <Button size="lg" variant="outline" className="px-4" onClick={() => setPicking(true)}>
            Pick another
          </Button>
        </div>
      </div>
    )
  }
  const others = known.map(({ product }) => product).filter((product) => product.id !== top?.id)
  return (
    <div className={field}>
      {others.length > 0 ? (
        <>
          <p className="text-sm text-fg-secondary">Could it be one of these?</p>
          <div className="flex flex-col gap-2">
            {others.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-auto justify-start p-2"
                onClick={() => onConfirm(product.id)}
              >
                <ProductOption product={product} />
              </Button>
            ))}
          </div>
        </>
      ) : null}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (picked) onConfirm(picked)
        }}
      >
        <label htmlFor={selectId} className="w-full text-sm text-fg-secondary">
          Or choose it from the catalogue
        </label>
        <NativeSelect id={selectId} size="lg" value={picked} onChange={(event) => setPicked(event.target.value)}>
          <option value="">Choose a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" size="lg" className="px-4" disabled={!picked}>
          Confirm
        </Button>
      </form>
    </div>
  )
}

/** One line of text with a submit button: `askName` and `askEmail`. */
function LineWidget({
  label,
  type = 'text',
  maxLength,
  autoComplete,
  action,
  onSubmit,
  autoFocus = true,
}: {
  label: string
  type?: 'text' | 'email'
  maxLength: number
  autoComplete: string
  action: string
  onSubmit: (value: string) => void
  /** Off for a field that is there as the panel opens, where the heading takes focus. */
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <form
      className={field}
      onSubmit={(event) => {
        event.preventDefault()
        const value = String(new FormData(event.currentTarget).get('value') ?? '').trim()
        if (value) onSubmit(value)
      }}
    >
      <label htmlFor={id} className="text-sm text-fg-secondary">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="value"
          type={type}
          required
          maxLength={maxLength}
          autoComplete={autoComplete}
          className="h-9"
          autoFocus={autoFocus}
        />
        <Button type="submit" size="lg" className="px-4">
          {action}
        </Button>
      </div>
    </form>
  )
}

export function NameWidget({
  onSubmit,
  autoFocus,
}: {
  onSubmit: (name: string) => void
  autoFocus?: boolean
}) {
  return (
    <LineWidget
      label="Your name, as it will be published"
      maxLength={NAME_MAX_LENGTH}
      autoComplete="name"
      action="Continue"
      onSubmit={onSubmit}
      autoFocus={autoFocus}
    />
  )
}

/** The address goes to the run beside the tool's answer, never in it. */
export function EmailWidget({ onSubmit }: { onSubmit: (email: string) => void }) {
  return (
    <LineWidget
      label="Your email address, for a code and the editor's answer. It is never published."
      type="email"
      maxLength={254}
      autoComplete="email"
      action="Send code"
      onSubmit={onSubmit}
    />
  )
}

/** `reviewQuote`: the exact text that will be published, editable. */
export function QuoteWidget({ text, onSubmit }: { text: string; onSubmit: (quote: string) => void }) {
  const [quote, setQuote] = useState(text)
  const id = useId()
  const empty = quote.trim().length === 0
  return (
    <form
      className={field}
      onSubmit={(event) => {
        event.preventDefault()
        if (!empty) onSubmit(quote)
      }}
    >
      <label htmlFor={id} className="text-sm text-fg-secondary">
        Your words, exactly as they will be published
      </label>
      <textarea
        id={id}
        value={quote}
        maxLength={QUOTE_MAX_LENGTH}
        rows={4}
        onChange={(event) => setQuote(event.target.value)}
        className="w-full rounded-lg border border-input bg-bg px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-fg-secondary tabular-nums">
          {quote.length} / {QUOTE_MAX_LENGTH}
        </span>
        <Button type="submit" size="lg" className="px-4" disabled={empty}>
          Use this quote
        </Button>
      </div>
    </form>
  )
}

export function ConsentWidget({ onSubmit }: { onSubmit: () => void }) {
  const [checked, setChecked] = useState(false)
  const id = useId()
  return (
    <form
      className={field}
      onSubmit={(event) => {
        event.preventDefault()
        if (checked) onSubmit()
      }}
    >
      {/* The box inside its label: one hit target, no gap between them. */}
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent"
        />
        I took this photo and allow the store to publish it with my name and words.
      </label>
      <Button type="submit" size="lg" className="w-fit px-4" disabled={!checked}>
        Continue
      </Button>
    </form>
  )
}

/** `askCode`: six digits, pasted or typed, and "Send again" once allowed. */
export function CodeWidget({
  onSubmit,
  onResend,
}: {
  onSubmit: (code: string) => void
  onResend: () => void
}) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: CODE_LENGTH }, () => ''))
  const [wait, setWait] = useState(CODE_RESEND_SECONDS)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (wait === 0) return
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  function fill(from: number, value: string) {
    const typed = value.replace(/\D/g, '').slice(0, CODE_LENGTH - from)
    if (!typed) return
    const next = [...digits]
    for (let i = 0; i < typed.length; i++) next[from + i] = typed[i] as string
    setDigits(next)
    inputs.current[Math.min(from + typed.length, CODE_LENGTH - 1)]?.focus()
  }

  const code = digits.join('')
  return (
    <form
      className={field}
      onSubmit={(event) => {
        event.preventDefault()
        if (code.length === CODE_LENGTH) onSubmit(code)
      }}
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm text-fg-secondary">The code from the email</legend>
        <div className="flex gap-2">
          {digits.map((digit, index) => (
            <Input
              key={index}
              ref={(element) => {
                inputs.current[index] = element
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              autoFocus={index === 0}
              className="h-11 w-10 text-center text-lg tabular-nums"
              onChange={(event) => {
                if (event.target.value === '') {
                  setDigits(digits.map((d, i) => (i === index ? '' : d)))
                } else {
                  fill(index, event.target.value)
                }
              }}
              onPaste={(event) => {
                event.preventDefault()
                fill(index, event.clipboardData.getData('text'))
              }}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && digit === '' && index > 0) inputs.current[index - 1]?.focus()
              }}
            />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" className="px-4" disabled={code.length !== CODE_LENGTH}>
          Verify
        </Button>
        <Button type="button" variant="ghost" size="lg" className="px-4" disabled={wait > 0} onClick={onResend}>
          {wait > 0 ? `Send again in ${wait}\u00a0s` : 'Send again'}
        </Button>
      </div>
    </form>
  )
}
