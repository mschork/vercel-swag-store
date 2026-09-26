import Form from 'next/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import type { Category } from '@/lib/api/types'

/** Value of the "no category" option; the empty string keeps it out of the URL. */
export const ALL_CATEGORIES = ''

/**
 * The form's markup, written once and rendered twice: by the server as the
 * Suspense fallback (uncontrolled, no handlers, a plain GET that works without
 * JavaScript) and by the client leaf with values and handlers. One copy, so
 * the swap at hydration cannot shift the layout. It runs as server or client
 * code, following its importer.
 */
export function SearchFormFields({
  categories,
  query,
  category,
  pressed = false,
  onSubmit,
  onQueryChange,
  onCategoryChange,
}: {
  categories: readonly Category[]
  /** Controlled value; omitted by the server fallback, which stays uncontrolled. */
  query?: string
  category?: string
  /** Shows the button pressed, so a submit by Enter is seen to happen. */
  pressed?: boolean
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  onQueryChange?: (value: string) => void
  onCategoryChange?: (value: string) => void
}) {
  return (
    <Form
      action="/search"
      onSubmit={onSubmit}
      role="search"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="flex-1">
        <label htmlFor="search-q" className="sr-only">
          Search products
        </label>
        <Input
          id="search-q"
          name="q"
          type="search"
          placeholder="Search products"
          autoComplete="off"
          className="h-11"
          {...(query === undefined
            ? {}
            : { value: query, onChange: (event) => onQueryChange?.(event.target.value) })}
        />
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="search-category" className="sr-only">
          Category
        </label>
        <NativeSelect
          id="search-category"
          name="category"
          size="lg"
          className="w-full sm:w-48"
          {...(category === undefined
            ? {}
            : {
                value: category,
                onChange: (event) => onCategoryChange?.(event.target.value),
              })}
        >
          <NativeSelectOption value={ALL_CATEGORIES}>
            All categories
          </NativeSelectOption>
          {categories.map((item) => (
            <NativeSelectOption key={item.slug} value={item.slug}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="submit"
          size="lg"
          className="h-11 px-4 data-pressed:translate-y-px data-pressed:opacity-80 data-pressed:transition-none"
          data-pressed={pressed || undefined}
        >
          Search
        </Button>
      </div>
    </Form>
  )
}
