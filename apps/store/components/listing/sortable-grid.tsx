'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  isSortOrder,
  SORT_LABELS,
  SORT_ORDERS,
  sortProducts,
  type SortOrder,
} from '@/lib/listing'

type Item = { id: string; price: number; card: ReactNode }

const subscribe = () => () => {}

/**
 * Re-orders cards the server already rendered (specs/E18-product-listing.md).
 * The list items move in the DOM, never with CSS `order`, so reading order,
 * tab order and visual order stay one thing. The choice is component state: a
 * sort is a view of the products on this page, not another page.
 *
 * The select exists only after hydration, so without JavaScript there is no
 * control that does nothing. Its row is always rendered, with the count in it,
 * so the select arriving shifts nothing.
 */
export function SortableGrid({
  items,
  gridClassName,
  summary,
}: {
  items: readonly Item[]
  gridClassName: string
  summary: string
}) {
  const [order, setOrder] = useState<SortOrder>('default')
  const [announcement, setAnnouncement] = useState('')
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)
  const sortable = hydrated && items.length > 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-9 items-center justify-between gap-4">
        <p className="text-sm whitespace-nowrap text-fg-secondary">{summary}</p>
        {sortable ? (
          <div className="flex items-center gap-2">
            <label htmlFor="listing-sort" className="text-sm text-fg-secondary">
              Sort
            </label>
            <NativeSelect
              id="listing-sort"
              className="w-40 sm:w-44"
              value={order}
              onChange={(event) => {
                const next = event.target.value
                if (!isSortOrder(next)) return
                setOrder(next)
                setAnnouncement(SORT_LABELS[next].announcement)
              }}
            >
              {SORT_ORDERS.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {SORT_LABELS[value].option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <ul aria-label="Products" className={gridClassName}>
        {sortProducts(items, order).map((item) => (
          <li key={item.id}>{item.card}</li>
        ))}
      </ul>
    </div>
  )
}
