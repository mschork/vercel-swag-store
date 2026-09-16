import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

const SIZE = {
  sm: 'text-[13px]',
  md: 'text-sm',
  lg: 'text-xl',
} as const

/** A price in Geist Mono with tabular numerals; every price on a page goes through this. */
export function Price({
  cents,
  currency,
  size = 'md',
  className,
  ...props
}: React.ComponentProps<'span'> & {
  cents: number
  currency: string
  size?: keyof typeof SIZE
}) {
  return (
    <span
      className={cn('font-mono tabular-nums', SIZE[size], className)}
      {...props}
    >
      {formatPrice(cents, currency)}
    </span>
  )
}
