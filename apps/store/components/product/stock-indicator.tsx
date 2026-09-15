import type { StockStatus, StockTone } from '@/lib/stock-status'

const TONE_CLASS: Record<StockTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-fg-secondary',
}

/** The stock line: the text carries the meaning, the colour repeats it, no icon. */
export function StockIndicator({
  status,
}: {
  status: Pick<StockStatus, 'label' | 'tone'>
}) {
  return (
    <p className={`text-sm leading-6 font-medium ${TONE_CLASS[status.tone]}`}>
      {status.label}
    </p>
  )
}
