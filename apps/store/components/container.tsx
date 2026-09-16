import { cn } from '@/lib/utils'

/**
 * The content column. `main` is full width so the hero can bleed to the
 * edges; every page puts its content in one of these.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}
      {...props}
    />
  )
}
